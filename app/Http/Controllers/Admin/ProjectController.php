<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(): Response
    {
        $projects = Project::with(['creator', 'client', 'assignments.user'])
            ->orderByRaw("FIELD(status, 'active', 'upcoming', 'completed', 'cancelled')")
            ->paginate(15);

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function create(): Response
    {
        // HR က project create ဖို့ client list လိုတယ်
        $clients = Client::orderBy('company_name')->get(['id', 'company_name', 'country']);

        return Inertia::render('Admin/Projects/Create', [
            'clients' => $clients,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'status'         => 'required|in:upcoming,active,completed,cancelled',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after_or_equal:start_date',
            // P&L fields (new)
            'client_id'      => 'nullable|exists:clients,id',
            'contract_value' => 'nullable|numeric|min:0',
            'currency'       => 'nullable|string|max:10',
            'est_team_size'  => 'nullable|integer|min:1|max:999',
        ]);

        $project = Project::create([
            ...$validated,
            'created_by' => Auth::id(),
            'currency'   => $validated['currency'] ?? 'USD',
        ]);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    public function show(Project $project): Response
    {
        $project->load([
            'creator',
            'assignments'       => fn($q) => $q->where('status', '!=', 'removed')
                                            ->orderBy('priority_order'),
            'assignments.user',
            'assignments.assignedBy',
            'logs'              => fn($q) => $q->orderByDesc('created_at'),
            'logs.user',
            'logs.changedBy',
        ]);

        $authUser = Auth::user();

        $availableUsers = User::whereHas('role', fn($q) => $q->where('name', 'employee'))
            ->where('is_active', true)
            ->when(!$authUser->isAdmin(), fn($q) => $q->where('country', $authUser->country))
            ->with(['assignments' => fn($q) => $q
                ->whereIn('status', ['active', 'upcoming'])
                ->where('end_date', '>=', now())
                ->with('project:id,name')
                ->orderBy('priority_order')
            ])
            ->get()
            ->map(fn($user) => [
                'id'                  => $user->id,
                'name'                => $user->name,
                'email'               => $user->email,
                'avatar_url'          => $user->avatar_url,
                'country'             => $user->country,
                'active_count'        => $user->assignments->where('status', 'active')->count(),
                'used_hours_per_day'  => $user->assignments
                    ->whereIn('status', ['active', 'upcoming'])
                    ->sum('hours_per_day'),
                // Priority feature အတွက်
                'next_priority'       => \App\Models\ProjectAssignment::nextPriorityFor($user->id),
                'current_assignments' => $user->assignments
                    ->whereIn('status', ['active', 'upcoming'])
                    ->sortBy('priority_order')
                    ->map(fn($a) => [
                        'id'             => $a->id,
                        'project_id'     => $a->project_id,
                        'project_name'   => $a->project?->name,
                        'hours_per_day'  => $a->hours_per_day,
                        'status'         => $a->status,
                        'priority_order' => $a->priority_order,
                    ])->values(),
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
        $clients = Client::orderBy('company_name')->get(['id', 'company_name', 'country']);

        return Inertia::render('Admin/Projects/Edit', [
            'project' => $project,
            'clients' => $clients,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'status'         => 'required|in:upcoming,active,completed,cancelled',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after_or_equal:start_date',
            // P&L fields (new)
            'client_id'      => 'nullable|exists:clients,id',
            'contract_value' => 'nullable|numeric|min:0',
            'currency'       => 'nullable|string|max:10',
            'est_team_size'  => 'nullable|integer|min:1|max:999',
        ]);

        $project->update($validated);

        return back()->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project deleted successfully.');
    }
}