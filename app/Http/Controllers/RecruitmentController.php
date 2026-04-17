<?php

namespace App\Http\Controllers;

use App\Models\BrycenOffice;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\JobInterview;
use App\Mail\InterviewInvitationMail;
use App\Mail\ApplicationStatusMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RecruitmentController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    //  PUBLIC — Home Page  GET /
    // ─────────────────────────────────────────────────────────────
    public function home()
    {
        $offices = BrycenOffice::where('is_active', true)
            ->withCount(['openJobPostings'])
            ->orderByRaw("FIELD(country_key, 'japan','myanmar','cambodia','vietnam','korea')")
            ->get()
            ->map(fn($o) => [
                'id'                      => $o->id,
                'country_key'             => $o->country_key,
                'country_name'            => $o->country_name,
                'company_name'            => $o->company_name,
                'city'                    => $o->city,
                'image_path'              => asset($o->image_path),
                'about'                   => Str::limit($o->about, 120),
                'specialization'          => $o->specialization,
                'open_job_postings_count' => $o->open_job_postings_count,
            ]);

        return Inertia::render('Welcome', [
            'offices' => $offices,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  PUBLIC — Country Detail  GET /brycen/{country}
    // ─────────────────────────────────────────────────────────────
    public function show(string $countryKey)
    {
        $office = BrycenOffice::where('country_key', $countryKey)
            ->where('is_active', true)
            ->firstOrFail();

        $salaryRule = \App\Models\SalaryRule::where('country_id', function ($q) use ($office) {
            $q->select('id')->from('countries')
              ->whereRaw('LOWER(name) = ?', [strtolower($office->country_name)])
              ->limit(1);
        })->with('currency')->first();
        $currencyCode = $salaryRule?->currency?->currency_code ?? '';

        $jobs = JobPosting::where('brycen_office_id', $office->id)
            ->where('status', 'open')
            ->where(function ($q) {
                $q->whereNull('deadline')
                ->orWhereDate('deadline', '>=', now()->toDateString());
            })
            ->withCount('applications')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($j) => [
                'id'                 => $j->id,
                'title'              => $j->title,
                'department'         => $j->department,
                'type'               => $j->type,
                'slots'              => $j->slots,
                'salary_range'       => $j->salary_range,
                'currency_code'      => $currencyCode,
                'deadline'           => $j->deadline?->format('d M Y'),
                'applications_count' => $j->applications_count,
                'description'        => $j->description,
                'requirements'       => $j->requirements,
                'responsibilities'   => $j->responsibilities,
            ]);

        return Inertia::render('Brycen/Country', [
            'office' => [
                'id'             => $office->id,
                'country_key'    => $office->country_key,
                'country_name'   => $office->country_name,
                'company_name'   => $office->company_name,
                'city'           => $office->city,
                'address'        => $office->address,
                'email'          => $office->email,
                'phone'          => $office->phone,
                'website_url'    => $office->website_url,
                'map_embed_url'  => $office->map_embed_url,
                'image_path'     => asset($office->image_path),
                'about'          => $office->about,
                'founded'        => $office->founded,
                'specialization' => $office->specialization,
            ],
            'jobs' => $jobs,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  PUBLIC — Job Detail  GET /brycen/{country}/jobs/{job}
    // ─────────────────────────────────────────────────────────────
    public function jobDetail(string $countryKey, JobPosting $job)
    {
        $office = BrycenOffice::where('country_key', $countryKey)->firstOrFail();
        abort_if($job->brycen_office_id !== $office->id, 404);

        return Inertia::render('Brycen/JobDetail', [
            'office' => [
                'country_key'  => $office->country_key,
                'country_name' => $office->country_name,
                'company_name' => $office->company_name,
                'city'         => $office->city,
                'image_path'   => asset($office->image_path),
            ],
            'job' => [
                'id'               => $job->id,
                'title'            => $job->title,
                'department'       => $job->department,
                'type'             => $job->type,
                'slots'            => $job->slots,
                'description'      => $job->description,
                'requirements'     => $job->requirements,
                'responsibilities' => $job->responsibilities,
                'salary_range'     => $job->salary_range,
                'deadline'         => $job->deadline?->format('d M Y'),
                'status'           => $job->status,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  PUBLIC — Submit Application  POST /brycen/{country}/jobs/{job}/apply
    // ─────────────────────────────────────────────────────────────
    public function apply(Request $request, string $countryKey, JobPosting $job)
    {
        $office = BrycenOffice::where('country_key', $countryKey)->firstOrFail();
        abort_if($job->brycen_office_id !== $office->id || $job->status !== 'open', 404);

        $validated = $request->validate([
            'name'         => 'required|string|max:150',
            'email'        => 'required|email|max:200',
            'phone'        => 'nullable|string|max:30',
            'cover_letter' => 'nullable|string|max:2000',
            'cv'           => 'required|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $file    = $request->file('cv');
        $refCode = strtoupper(Str::random(3)) . '-' . now()->format('ymd') . '-' . strtoupper(Str::random(4));
        $path    = $file->storeAs(
            "cv/{$countryKey}",
            "{$refCode}_{$validated['name']}." . $file->getClientOriginalExtension(),
            'public'
        );

        JobApplication::create([
            'job_posting_id' => $job->id,
            'name'           => $validated['name'],
            'email'          => $validated['email'],
            'phone'          => $validated['phone'] ?? null,
            'cv_path'        => $path,
            'cover_letter'   => $validated['cover_letter'] ?? null,
            'status'         => 'new',
            'reference_code' => $refCode,
        ]);

        $this->notifyHR($office, $job, $validated['name'], $refCode);

        return back()->with([
            'success'        => 'Application submitted successfully!',
            'reference_code' => $refCode,
        ]);
    }

    // ── Notify HR role users in the same country ──────────────────
    private function notifyHR(
        BrycenOffice $office,
        JobPosting   $job,
        string       $applicantName,
        string       $refCode
    ): void {
        $country = \App\Models\Country::whereRaw(
            'LOWER(name) = ?', [strtolower($office->country_name)]
        )->first();

        if (!$country) return;

        $hrUsers = \App\Models\User::hr()
            ->ofCountry($country->id)
            ->get();

        foreach ($hrUsers as $hr) {
            \App\Models\Notification::send(
                userId: $hr->id,
                type:   'job_application',
                title:  'New Job Application',
                body:   "{$applicantName} applied for {$job->title}.",
                url:    '/recruitment',
                data:   [
                    'job_posting_id' => $job->id,
                    'job_title'      => $job->title,
                    'applicant_name' => $applicantName,
                    'reference_code' => $refCode,
                ]
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  PUBLIC — Track Application  GET /track/{code}
    // ─────────────────────────────────────────────────────────────
    public function track(string $code)
    {
        $application = JobApplication::where('reference_code', $code)
            ->with(['jobPosting.office', 'interview'])
            ->firstOrFail();

        return Inertia::render('Brycen/Track', [
            'application' => [
                'name'           => $application->name,
                'reference_code' => $application->reference_code,
                'status'         => $application->status,
                'applied_at'     => $application->created_at->format('d M Y'),
                'job_title'      => $application->jobPosting->title,
                'company'        => $application->jobPosting->office->company_name,
                'city'           => $application->jobPosting->office->city,
                'country'        => $application->jobPosting->office->country_name,
                'website'        => $application->jobPosting->office->website_url,
            ],
            'interview' => $application->interview ? [
                'scheduled_at'      => $application->interview->scheduled_at->format('l, d F Y \a\t h:i A'),
                'type'              => $application->interview->type,
                'platform'          => $application->interview->platform,
                'meeting_link'      => $application->interview->meeting_link,
                'location'          => $application->interview->location,
                'interviewer_name'  => $application->interview->interviewer_name,
                'note_to_candidate' => $application->interview->note_to_candidate,
                'score'             => $application->interview->recommendation ? $application->interview->score : null,
                'recommendation'    => $application->interview->recommendation,
            ] : null,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  HR/ADMIN — Recruitment Dashboard  GET /recruitment
    // ─────────────────────────────────────────────────────────────
    public function hrIndex()
    {
        $user    = Auth::user();
        $isAdmin = $user->hasRole('admin');
        $isHR    = $user->hasRole('hr');

        $hrOffice = null;
        if ($isHR) {
            $countryName = $user->countryRecord?->name;

            // DEBUG: DB ထဲမှာ ဘာရှိတာ စစ်
            $allOffices = BrycenOffice::select('id', 'company_name', 'country_name', 'is_active')->get();

            if ($countryName) {
                $hrOffice = BrycenOffice::whereRaw('LOWER(country_name) = ?', [strtolower($countryName)])
                    ->first();
            }
        }

        // ── Offices ──────────────────────────────────────────────
        // Admin: all offices, HR: only own office
        $officesQuery = BrycenOffice::where('is_active', true)
            ->withCount(['openJobPostings', 'jobPostings']);
        if ($isHR && $hrOffice) {
            $officesQuery->where('id', $hrOffice->id);
        }
        $offices = $officesQuery->get();

        // ── Jobs ─────────────────────────────────────────────────
        // Admin: all jobs, HR: only own branch jobs
        $jobsQuery = JobPosting::with('office')
            ->withCount('applications')
            ->orderByDesc('created_at');
        if ($isHR && $hrOffice) {
            $jobsQuery->where('brycen_office_id', $hrOffice->id);
        }
        $jobs = $jobsQuery->get()->map(fn($j) => [
            'id'                 => $j->id,
            'brycen_office_id'   => $j->brycen_office_id,
            'title'              => $j->title,
            'department'         => $j->department,
            'type'               => $j->type,
            'slots'              => $j->slots,
            'description'        => $j->description,
            'requirements'       => $j->requirements,
            'responsibilities'   => $j->responsibilities,
            'salary_range'       => $j->salary_range,
            'status'             => $j->status,
            'deadline'           => $j->deadline?->format('Y-m-d'),
            'applications_count' => $j->applications_count,
            'office'             => [
                'id'           => $j->office?->id,
                'company_name' => $j->office?->company_name,
                'country_key'  => $j->office?->country_key,
            ],
        ]);

        // ── Applications ─────────────────────────────────────────
        // Admin: all apps, HR: only own branch apps
        $appsQuery = JobApplication::with(['jobPosting.office', 'interview'])
            ->orderByDesc('created_at');
        if ($isHR && $hrOffice) {
            $appsQuery->whereHas('jobPosting', fn($q) =>
                $q->where('brycen_office_id', $hrOffice->id)
            );
        }
        $recentApps = $appsQuery->get()->map(fn($a) => [
            'id'              => $a->id,
            'job_posting_id'  => $a->job_posting_id,
            'name'            => $a->name,
            'email'           => $a->email,
            'phone'           => $a->phone,
            'status'          => $a->status,
            'reference_code'  => $a->reference_code,
            'cv_url'          => Storage::url($a->cv_path),
            'cv_download_url' => route('recruitment.cv.download', $a->id),
            'cover_letter'    => $a->cover_letter,
            'hr_note'         => $a->hr_note,
            'applied_at'      => $a->created_at->format('d M Y'),
            'job_posting'     => [
                'title'  => $a->jobPosting?->title,
                'office' => ['company_name' => $a->jobPosting?->office?->company_name],
            ],
            'interview' => $a->interview ? [
                'id'                => $a->interview->id,
                'scheduled_at'      => $a->interview->scheduled_at->format('d M Y, h:i A'),
                'scheduled_at_raw'  => $a->interview->scheduled_at->toDateTimeLocalString(),
                'type'              => $a->interview->type,
                'platform'          => $a->interview->platform,
                'meeting_link'      => $a->interview->meeting_link,
                'location'          => $a->interview->location,
                'interviewer_name'  => $a->interview->interviewer_name,
                'note_to_candidate' => $a->interview->note_to_candidate,
                'score'             => $a->interview->score,
                'strengths'         => $a->interview->strengths,
                'weaknesses'        => $a->interview->weaknesses,
                'recommendation'    => $a->interview->recommendation,
                'internal_note'     => $a->interview->internal_note,
            ] : null,
        ]);
        \Log::info('HR Debug', [
            'user_id'      => $user->id,
            'country_id'   => $user->country_id,
            'countryRecord'=> $user->countryRecord?->name,
            'hrOffice'     => $hrOffice?->company_name,
        ]);
        return Inertia::render('Recruitment/Index', [
            'offices'    => $offices,
            'jobs'       => $jobs,
            'recentApps' => $recentApps,
            'isAdmin'    => $isAdmin,
            'isHR'       => $isHR,
            'hrOffice'   => $hrOffice ? [
                'id'           => $hrOffice->id,
                'company_name' => $hrOffice->company_name,
                'country_key'  => $hrOffice->country_key,
            ] : null,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Job Posting CRUD
    // ─────────────────────────────────────────────────────────────
    public function storeJob(Request $request)
    {
        if (Auth::user()->role === 'admin') {
            abort(403, 'Admins cannot create job postings.');
        }

        $validated = $request->validate([
            'brycen_office_id' => 'required|exists:brycen_offices,id',
            'title'            => 'required|string|max:200',
            'department'       => 'nullable|string|max:100',
            'type'             => 'required|in:full_time,part_time,contract,internship',
            'slots'            => 'required|integer|min:1',
            'description'      => 'required|string',
            'requirements'     => 'required|string',
            'responsibilities' => 'nullable|string',
            'salary_range'     => 'nullable|string|max:100',
            'deadline'         => 'nullable|date',
        ]);

        JobPosting::create($validated);
        return back()->with('success', 'Job posting created.');
    }

    public function updateJob(Request $request, JobPosting $job)
    {
        if (Auth::user()->role === 'admin') abort(403);
        $this->authorizeHROffice($job->brycen_office_id);

        $validated = $request->validate([
            'title'            => 'sometimes|string|max:200',
            'department'       => 'nullable|string|max:100',
            'type'             => 'sometimes|in:full_time,part_time,contract,internship',
            'slots'            => 'sometimes|integer|min:1',
            'description'      => 'sometimes|string',
            'requirements'     => 'sometimes|string',
            'responsibilities' => 'nullable|string',
            'salary_range'     => 'nullable|string|max:100',
            'status'           => 'sometimes|in:open,closed,paused',
            'deadline'         => 'nullable|date',
        ]);

        $job->update($validated);
        return back()->with('success', 'Job posting updated.');
    }

    public function destroyJob(JobPosting $job)
    {
        if (Auth::user()->role === 'admin') abort(403);
        $this->authorizeHROffice($job->brycen_office_id);

        $applications = $job->applications()->get();
        foreach ($applications as $application) {
            if ($application->cv_path) {
                if (Storage::disk('public')->exists($application->cv_path)) {
                    Storage::disk('public')->delete($application->cv_path);
                } elseif (Storage::exists($application->cv_path)) {
                    Storage::delete($application->cv_path);
                }
            }
        }

        $job->delete();
        return back()->with('success', 'Job posting and all related data deleted.');
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Applications List  GET /recruitment/jobs/{job}/applications
    // ─────────────────────────────────────────────────────────────
    public function applications(JobPosting $job)
    {
        $apps = $job->applications()->orderByDesc('created_at')->get();

        return Inertia::render('Recruitment/Applications', [
            'job'          => $job->load('office'),
            'applications' => $apps->map(fn($a) => [
                'id'             => $a->id,
                'name'           => $a->name,
                'email'          => $a->email,
                'phone'          => $a->phone,
                'status'         => $a->status,
                'reference_code' => $a->reference_code,
                'cv_url'         => Storage::url($a->cv_path),
                'cover_letter'   => $a->cover_letter,
                'hr_note'        => $a->hr_note,
                'applied_at'     => $a->created_at->format('d M Y'),
            ]),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Update Application Status + Send Email
    // ─────────────────────────────────────────────────────────────
    public function updateApplication(Request $request, JobApplication $application)
    {
        if (Auth::user()->role === 'admin') abort(403);

        $request->validate([
            'status'  => 'required|in:new,reviewing,interview,accepted,rejected',
            'hr_note' => 'nullable|string|max:1000',
        ]);

        $oldStatus = $application->status;
        $newStatus = $request->status;

        $application->update([
            'status'  => $newStatus,
            'hr_note' => $request->hr_note,
        ]);

        $emailStatuses = ['reviewing', 'accepted', 'rejected'];
        if ($newStatus !== $oldStatus && in_array($newStatus, $emailStatuses)) {
            Mail::to($application->email)
                ->send(new ApplicationStatusMail(
                    $application->load(['jobPosting.office']),
                    $newStatus
                ));
        }

        return back()->with('success', 'Application updated.');
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Delete Application (rejected only)
    // ─────────────────────────────────────────────────────────────
    public function deleteApplication(JobApplication $application)
    {
        if ($application->status !== 'rejected') {
            return back()->withErrors(['delete' => 'Only rejected applications can be deleted.']);
        }

        if ($application->cv_path) {
            if (Storage::disk('public')->exists($application->cv_path)) {
                Storage::disk('public')->delete($application->cv_path);
            } elseif (Storage::exists($application->cv_path)) {
                Storage::delete($application->cv_path);
            }
        }

        $application->delete();
        return back()->with('success', 'Application deleted successfully.');
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Download CV  GET /recruitment/applications/{application}/cv
    // ─────────────────────────────────────────────────────────────
    public function downloadCv(JobApplication $application)
    {
        $path = $application->cv_path;

        if (Storage::disk('public')->exists($path)) {
            $fullPath = Storage::disk('public')->path($path);
            return response()->download($fullPath, basename($path));
        }

        if (Storage::exists($path)) {
            return Storage::download($path, basename($path));
        }

        abort(404, 'CV file not found.');
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Schedule Interview
    // ─────────────────────────────────────────────────────────────
    public function scheduleInterview(Request $request, JobApplication $application)
    {
        if (Auth::user()->role === 'admin') abort(403);

        $validated = $request->validate([
            'scheduled_at'      => 'required|date|after:now',
            'type'              => 'required|in:online,onsite',
            'platform'          => 'nullable|in:zoom,google_meet,teams,physical,other',
            'meeting_link'      => 'nullable|url|max:500',
            'location'          => 'nullable|string|max:300',
            'interviewer_name'  => 'nullable|string|max:150',
            'note_to_candidate' => 'nullable|string|max:1000',
        ]);

        $interview = JobInterview::updateOrCreate(
            ['job_application_id' => $application->id],
            [...$validated, 'created_by' => Auth::id()]
        );

        $application->update(['status' => 'interview']);

        Mail::to($application->email)
            ->send(new InterviewInvitationMail(
                $interview->load(['application.jobPosting.office'])
            ));

        return back()->with('success', 'Interview scheduled and invitation sent to ' . $application->email);
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Save Interview Score
    // ─────────────────────────────────────────────────────────────
    public function saveScore(Request $request, JobApplication $application)
    {
        if (Auth::user()->role === 'admin') abort(403);

        $validated = $request->validate([
            'score'          => 'required|integer|min:0|max:100',
            'strengths'      => 'nullable|string|max:1000',
            'weaknesses'     => 'nullable|string|max:1000',
            'recommendation' => 'required|in:proceed,hold,reject',
            'internal_note'  => 'nullable|string|max:1000',
        ]);

        $interview = $application->interview;
        if (!$interview) {
            return back()->withErrors(['score' => 'No interview found for this application.']);
        }

        $interview->update($validated);
        return back()->with('success', 'Interview score saved successfully.');
    }

    // ─────────────────────────────────────────────────────────────
    //  HR — Bulk Update Applications
    // ─────────────────────────────────────────────────────────────
    public function bulkUpdateApplications(Request $request)
    {
        $request->validate([
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'exists:job_applications,id',
            'status' => 'required|in:new,reviewing,interview,accepted,rejected',
        ]);

        $applications = JobApplication::whereIn('id', $request->ids)
            ->with(['jobPosting.office'])
            ->get();

        $emailStatuses = ['reviewing', 'accepted', 'rejected'];

        foreach ($applications as $application) {
            $oldStatus = $application->status;
            $application->update(['status' => $request->status]);

            if ($request->status !== $oldStatus && in_array($request->status, $emailStatuses)) {
                Mail::to($application->email)
                    ->send(new ApplicationStatusMail($application, $request->status));
            }
        }

        return back()->with('success', count($request->ids) . ' applications updated to ' . $request->status . '.');
    }

    // ─────────────────────────────────────────────────────────────
    //  PRIVATE — HR office authorization helper
    // ─────────────────────────────────────────────────────────────
    private function authorizeHROffice(int $officeId): void
    {
        $user = Auth::user();
        if ($user->role !== 'hr') return;

        $countryName = $user->countryRecord?->name;
        $hrOffice = BrycenOffice::whereRaw(
            'LOWER(country_name) = ?', [strtolower($countryName ?? '')]
        )->first();

        if (!$hrOffice || $hrOffice->id !== $officeId) {
            abort(403, 'You can only manage your own branch.');
        }
    }
}