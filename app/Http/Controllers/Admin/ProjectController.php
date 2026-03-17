<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(): Response
    {
        $projects = Project::with(['creator', 'assignments.user'])
            ->orderByRaw("FIELD(status, 'active', 'upcoming', 'completed', 'cancelled')")
            ->paginate(15);

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Projects/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'required|in:upcoming,active,completed,cancelled',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
        ]);

        $project = Project::create([
            ...$validated,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    public function show(Project $project): Response
    {
        $project->load([
            'creator',
            'assignments'          => fn($q) => $q->where('status', '!=', 'removed'),
            'assignments.user',
            'assignments.assignedBy',
            'logs'                 => fn($q) => $q->orderByDesc('created_at'),
            'logs.user',
            'logs.changedBy',
        ]);

        $authUser = Auth::user();

        // Admin → all employees
        // Management → same country only
        $availableUsers = User::whereHas('role', fn($q) => $q->where('name', 'employee'))
            ->where('is_active', true)
            ->when(!$authUser->isAdmin(), fn($q) => $q->where('country', $authUser->country))
            ->with(['assignments' => fn($q) => $q
                ->whereIn('status', ['active', 'upcoming'])
                ->where('end_date', '>=', now())
            ])
            ->get()
            ->map(fn($user) => [
                'id'                 => $user->id,
                'name'               => $user->name,
                'email'              => $user->email,
                'avatar_url'         => $user->avatar_url,
                'country'            => $user->country,
                'active_count'       => $user->assignments->where('status', 'active')->count(),
                // Sum of hours_per_day across all active/upcoming assignments (true daily load)
                'used_hours_per_day' => $user->assignments
                    ->whereIn('status', ['active', 'upcoming'])
                    ->sum('hours_per_day'),
            ])
            ->sortBy('active_count')
            ->values();

        return Inertia::render('Admin/Projects/Show', [
            'project'        => $project,
            'availableUsers' => $availableUsers,
        ]);
    }

    public function edit(Project $project): Response
    {
        return Inertia::render('Admin/Projects/Edit', [
            'project' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'required|in:upcoming,active,completed,cancelled',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
        ]);

        $project->update($validated);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project deleted successfully.');
    }
}