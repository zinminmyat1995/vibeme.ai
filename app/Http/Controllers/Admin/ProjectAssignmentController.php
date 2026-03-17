<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\AssignmentLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProjectAssignmentController extends Controller
{
    public function index(): Response
    {
        $authUser = Auth::user();

        $users = User::whereHas('role', fn($q) => $q->where('name', 'employee'))
            ->where('is_active', true)
            ->when(!$authUser->isAdmin(), fn($q) => $q->where('country', $authUser->country))
            ->with(['assignments' => fn($q) => $q
                ->where('status', '!=', 'removed')
                ->where('end_date', '>=', now())
                ->with('project')
            ])
            ->get()
            ->map(function ($user) {
                $activeCount   = $user->assignments->where('status', 'active')->count();
                $upcomingCount = $user->assignments->where('status', 'upcoming')->count();

                return [
                    'id'                  => $user->id,
                    'name'                => $user->name,
                    'email'               => $user->email,
                    'country'             => $user->country,
                    'department'          => $user->department,
                    'position'            => $user->position,
                    'avatar_url'          => $user->avatar_url,
                    'active_count'        => $activeCount,
                    'upcoming_count'      => $upcomingCount,
                    'workload'            => $this->getWorkload($activeCount),
                    // Sum of hours across active/upcoming assignments (for capacity bar)
                    'used_hours_per_day'  => $user->assignments
                        ->whereIn('status', ['active', 'upcoming'])
                        ->sum('hours_per_day'),
                    'assignments'    => $user->assignments->map(fn($a) => [
                        'id'            => $a->id,
                        'status'        => $a->status,
                        'start_date'    => $a->start_date,
                        'end_date'      => $a->end_date,
                        'hours_per_day' => $a->hours_per_day,
                        'project'       => $a->project ? [
                            'id'   => $a->project->id,
                            'name' => $a->project->name,
                        ] : null,
                    ]),
                ];
            });

        $projects = Project::where('status', '!=', 'cancelled')
            ->with(['assignments' => fn($q) => $q
                ->where('status', '!=', 'removed')
                ->with('user:id,name,avatar_url')
            ])
            ->get();

        return Inertia::render('Admin/Assignments/Index', [
            'users'    => $users,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id'    => 'required|exists:projects,id',
            'user_id'       => 'required|exists:users,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'hours_per_day' => 'integer|min:1|max:24',
            'notes'         => 'nullable|string',
        ]);

        $authUser   = Auth::user();
        $targetUser = User::findOrFail($validated['user_id']);

        if (!$authUser->isAdmin() && $targetUser->country !== $authUser->country) {
            abort(403, 'You can only assign employees from your country.');
        }

        // ── Check if this user already has an active/upcoming assignment in this project ──
        $existing = ProjectAssignment::where('project_id', $validated['project_id'])
            ->where('user_id',    $validated['user_id'])
            ->whereIn('status',   ['active', 'upcoming'])
            ->first();

        if ($existing) {
            // Instead of duplicating, update hours_per_day (add on top) and extend end_date if needed
            DB::transaction(function () use ($validated, $existing) {
                $oldValues = $existing->toArray();

                $newHours  = min(24, $existing->hours_per_day + ($validated['hours_per_day'] ?? 8));
                $newEnd    = max($existing->end_date, $validated['end_date']);

                $existing->update([
                    'hours_per_day' => $newHours,
                    'end_date'      => $newEnd,
                    'notes'         => $validated['notes'] ?: $existing->notes,
                ]);

                AssignmentLog::create([
                    'project_id' => $validated['project_id'],
                    'user_id'    => $validated['user_id'],
                    'action'     => 'edited',
                    'changed_by' => Auth::id(),
                    'old_values' => $oldValues,
                    'new_values' => $existing->fresh()->toArray(),
                ]);
            });

            return back()->with('success', 'Member already assigned — hours updated successfully.');
        }

        if (!ProjectAssignment::isAvailable($validated['user_id'], $validated['start_date'], $validated['end_date'])) {
            return back()->withErrors(['user_id' => 'This member has reached maximum project limit (3) for the selected period.']);
        }

        DB::transaction(function () use ($validated) {
            $startDate = $validated['start_date'];
            $status    = now()->lt($startDate) ? 'upcoming' : 'active';

            $assignment = ProjectAssignment::create([
                ...$validated,
                'assigned_by'   => Auth::id(),
                'hours_per_day' => $validated['hours_per_day'] ?? 8,
                'status'        => $status,
            ]);

            AssignmentLog::create([
                'project_id' => $validated['project_id'],
                'user_id'    => $validated['user_id'],
                'action'     => 'assigned',
                'changed_by' => Auth::id(),
                'old_values' => null,
                'new_values' => $assignment->toArray(),
            ]);
        });

        return back()->with('success', 'Member assigned successfully.');
    }

    public function update(Request $request, ProjectAssignment $projectAssignment)
    {
        $validated = $request->validate([
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'hours_per_day' => 'integer|min:1|max:8',
            'status'        => 'required|in:upcoming,active,completed,removed',
            'notes'         => 'nullable|string',
        ]);

        $authUser = Auth::user();
        if (!$authUser->isAdmin() && $projectAssignment->user->country !== $authUser->country) {
            abort(403, 'You can only manage employees from your country.');
        }

        if (!ProjectAssignment::isAvailable(
            $projectAssignment->user_id,
            $validated['start_date'],
            $validated['end_date'],
            $projectAssignment->id
        )) {
            return back()->withErrors(['user_id' => 'This member has reached maximum project limit (3) for the selected period.']);
        }

        DB::transaction(function () use ($validated, $projectAssignment) {
            $oldValues = $projectAssignment->toArray();
            $projectAssignment->update($validated);

            AssignmentLog::create([
                'project_id' => $projectAssignment->project_id,
                'user_id'    => $projectAssignment->user_id,
                'action'     => 'edited',
                'changed_by' => Auth::id(),
                'old_values' => $oldValues,
                'new_values' => $projectAssignment->fresh()->toArray(),
            ]);
        });

        return back()->with('success', 'Assignment updated successfully.');
    }

    public function destroy(ProjectAssignment $projectAssignment)
    {
        $authUser = Auth::user();
        if (!$authUser->isAdmin() && $projectAssignment->user->country !== $authUser->country) {
            abort(403, 'You can only manage employees from your country.');
        }

        DB::transaction(function () use ($projectAssignment) {
            AssignmentLog::create([
                'project_id' => $projectAssignment->project_id,
                'user_id'    => $projectAssignment->user_id,
                'action'     => 'removed',
                'changed_by' => Auth::id(),
                'old_values' => $projectAssignment->toArray(),
                'new_values' => null,
            ]);

            $projectAssignment->update(['status' => 'removed']);
            $projectAssignment->delete();
        });

        return back()->with('success', 'Assignment removed successfully.');
    }

    public function myAssignments(): Response
    {
        $assignments = ProjectAssignment::where('user_id', Auth::id())
            ->where('status', '!=', 'removed')
            ->with('project')
            ->orderBy('start_date')
            ->get();

        return Inertia::render('Employee/MyAssignments', [
            'assignments' => $assignments,
        ]);
    }

    public function availability(): Response
    {
        $authUser = Auth::user();

        $users = User::whereHas('role', fn($q) => $q->whereIn('name', ['employee', 'management']))
            ->where('is_active', true)
            ->when(!$authUser->isAdmin(), fn($q) => $q->where('country', $authUser->country))
            ->with(['assignments' => fn($q) => $q
                ->whereIn('status', ['active', 'upcoming'])
                ->where('end_date', '>=', now())
                ->with('project:id,name,end_date')
            ])
            ->get();

        return Inertia::render('Admin/Assignments/Availability', [
            'users' => $users,
        ]);
    }

    private function getWorkload(int $activeCount): string
    {
        return match (true) {
            $activeCount === 0 => 'free',
            $activeCount === 1 => 'light',
            $activeCount === 2 => 'moderate',
            default            => 'heavy',
        };
    }
}