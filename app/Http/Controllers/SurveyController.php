<?php
namespace App\Http\Controllers;

use App\Models\Survey;
use App\Services\SurveyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SurveyController extends Controller
{
    public function __construct(private SurveyService $service) {}

    // ── HR: List all surveys ───────────────
    public function index()
    {
        $user      = Auth::user();
        $countryId = $user->country_id;

        $surveys = Survey::with(['creator:id,name', 'questions'])
            ->where('country_id', $countryId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($s) => [
                'id'             => $s->id,
                'title'          => $s->title,
                'description'    => $s->description,
                'status'         => $s->status,
                'is_anonymous'   => $s->is_anonymous,
                'closes_at'      => $s->closes_at?->toDateString(),
                'response_count' => $s->responses()->count(),
                'question_count' => $s->questions->count(),
                'public_url'     => $s->publicUrl(),
                'token'          => $s->token,
                'created_by'     => $s->creator?->name,
                'created_at'     => $s->created_at->format('d M Y'),
            ]);

        return Inertia::render('Surveys/Index', [
            'surveys' => $surveys,
            'stats'   => $this->service->getStats($countryId),
        ]);
    }

    // ── HR: Create form ────────────────────
    public function create()
    {
        return Inertia::render('Surveys/Create', [
            'mode' => 'create',
        ]);
    }

    // ── HR: Store ──────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'title'                         => 'required|string|max:255',
            'description'                   => 'nullable|string',
            'status'                        => 'required|in:draft,active',
            'is_anonymous'                  => 'boolean',
            'closes_at'                     => 'nullable|date|after:today',
            'questions'                     => 'required|array|min:1',
            'questions.*.question'          => 'required|string',
            'questions.*.type'              => 'required|in:single_choice,multi_choice,text,rating,yes_no',
            'questions.*.options'           => 'nullable|array',
            'questions.*.is_required'       => 'boolean',
        ]);

        $user = Auth::user();
        $data = $request->all();
        $data['country_id'] = $user->country_id;

        $survey = $this->service->create($data, $user->id);

        return redirect()->route('surveys.index')
            ->with('success', 'Survey created successfully!');
    }

    // ── HR: Edit form ──────────────────────
    public function edit(Survey $survey)
    {
        $this->authorizeHR($survey);

        return Inertia::render('Surveys/Create', [
            'mode'   => 'edit',
            'survey' => [
                'id'           => $survey->id,
                'title'        => $survey->title,
                'description'  => $survey->description,
                'status'       => $survey->status,
                'is_anonymous' => $survey->is_anonymous,
                'closes_at'    => $survey->closes_at?->toDateString(),
                'questions'    => $survey->questions->map(fn($q) => [
                    'id'                       => $q->id,
                    'question'                 => $q->question,
                    'type'                     => $q->type,
                    'options'                  => $q->options,
                    'is_required'              => $q->is_required,
                    'depends_on_question_id'   => $q->depends_on_question_id,
                    'depends_on_answer'        => $q->depends_on_answer,
                ])->values(),
            ],
        ]);
    }

    // ── HR: Update ─────────────────────────
    public function update(Request $request, Survey $survey)
    {
        $this->authorizeHR($survey);

        $request->validate([
            'title'                => 'required|string|max:255',
            'status'               => 'required|in:draft,active,closed',
            'is_anonymous'         => 'boolean',
            'closes_at'            => 'nullable|date',
            'questions'            => 'required|array|min:1',
            'questions.*.question' => 'required|string',
            'questions.*.type'     => 'required|in:single_choice,multi_choice,text,rating,yes_no',
        ]);

        $this->service->update($survey, $request->all());

        return redirect()->route('surveys.index')
            ->with('success', 'Survey updated.');
    }

    // ── HR: Delete ─────────────────────────
    public function destroy(Survey $survey)
    {
        $this->authorizeHR($survey);
        $survey->delete();
        return back()->with('success', 'Survey deleted.');
    }

    // ── HR: Toggle status ──────────────────
    public function toggleStatus(Survey $survey)
    {
        $this->authorizeHR($survey);
        $next = match($survey->status) {
            'draft'  => 'active',
            'active' => 'closed',
            default  => $survey->status,
        };
        $survey->update(['status' => $next]);
        return back()->with('success', "Survey is now {$next}.");
    }

    // ── HR: Results page ───────────────────
public function results(Survey $survey)
{
    $this->authorizeHR($survey);
 
    $questions = $survey->questions()->get();
    $results   = $this->service->getResults($survey);
 
    // Add questions_raw for individual response view
    $results['questions_raw'] = $questions->map(fn($q) => [
        'id'       => $q->id,
        'question' => $q->question,
        'type'     => $q->type,
    ])->values()->toArray();
 
    // Individual responses
    $responses = $survey->responses()
        ->with('respondent:id,name,avatar_url,department')
        ->orderByDesc('submitted_at')
        ->get()
        ->map(fn($r) => [
            'id'                 => $r->id,
            'respondent'         => $survey->is_anonymous ? null : [
                'name'       => $r->respondent?->name,
                'avatar_url' => $r->respondent?->avatar_url,
                'department' => $r->respondent?->department,
            ],
            'answers'            => $r->answers,
            'submitted_at'       => $r->submitted_at->format('d M Y H:i'),
            'completion_seconds' => $r->completion_seconds,
        ])->toArray();
 
    return Inertia::render('Surveys/Results', [
        'survey'  => [
            'id'           => $survey->id,
            'title'        => $survey->title,
            'status'       => $survey->status,
            'is_anonymous' => $survey->is_anonymous,
            'closes_at'    => $survey->closes_at?->toDateString(),
            'ai_insight'   => $survey->ai_insight,
            'ai_insight_generated_at' => $survey->ai_insight_generated_at?->format('d M Y H:i'),
        ],
        'results'   => $results,
        'responses' => $responses,
    ]);
}
 


    // ── HR: Generate AI Insight ────────────
    public function generateInsight(Survey $survey)
    {
        $this->authorizeHR($survey);
        $insight = $this->service->generateInsight($survey);
        return response()->json(['insight' => $insight, 'success' => true]);
    }

    // ── HR: Export CSV ─────────────────────
    public function exportCsv(Survey $survey)
    {
        $this->authorizeHR($survey);
        $csv      = $this->service->exportCsv($survey);
        $filename = 'survey-' . $survey->id . '-results-' . now()->format('Y-m-d') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ── Public: Show survey form ───────────
    public function publicShow(string $token)
    {
        $survey = Survey::where('token', $token)
            ->with('questions')
            ->firstOrFail();

        $user = Auth::user();
        $ip   = request()->ip();

        if ($survey->isClosed() || $survey->isExpired()) {
            return Inertia::render('Surveys/Closed', ['title' => $survey->title]);
        }

        if (!$survey->isActive()) {
            abort(404);
        }

        // ← Named survey + not logged in → redirect to login
        if (!$survey->is_anonymous && !$user) {
            return redirect()->route('login')
                ->with('message', 'Please login to complete this survey.');
        }

        $alreadyResponded = $this->service->hasResponded($survey, $user?->id, $ip);

        return Inertia::render('Surveys/Public', [
            'survey' => [
                'id'           => $survey->id,
                'title'        => $survey->title,
                'description'  => $survey->description,
                'is_anonymous' => $survey->is_anonymous,
                'closes_at'    => $survey->closes_at?->toDateString(),
                'questions'    => $survey->questions->map(fn($q) => [
                    'id'                     => $q->id,
                    'question'               => $q->question,
                    'type'                   => $q->type,
                    'options'                => $q->getDefaultOptions(),
                    'is_required'            => $q->is_required,
                    'depends_on_question_id' => $q->depends_on_question_id,
                    'depends_on_answer'      => $q->depends_on_answer,
                ])->values(),
            ],
            'already_responded' => $alreadyResponded,
        ]);
    }

    // ── Public: Submit response ────────────
    public function publicSubmit(Request $request, string $token)
    {
        $survey = Survey::where('token', $token)->firstOrFail();

        if ($survey->isClosed() || $survey->isExpired() || !$survey->isActive()) {
            return response()->json(['error' => 'Survey is no longer accepting responses.'], 422);
        }

        $user = Auth::user();
        $ip   = $request->ip();

        if ($this->service->hasResponded($survey, $user?->id, $ip)) {
            return response()->json(['error' => 'You have already submitted a response.'], 422);
        }

        $request->validate([
            'answers'             => 'required|array',
            'completion_seconds'  => 'nullable|integer',
        ]);

        $this->service->submitResponse(
            $survey,
            $request->answers,
            $user?->id,
            $ip,
            $request->userAgent(),
            $request->completion_seconds ?? 0,
        );

        return response()->json(['success' => true, 'message' => 'Thank you for your response!']);
    }

    // ── Authorization ──────────────────────
    private function authorizeHR(Survey $survey): void
    {
        $user = Auth::user();
        $role = $user->role?->name;
        abort_unless(in_array($role, ['admin', 'hr']), 403);
    }
}