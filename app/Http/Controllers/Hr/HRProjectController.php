<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class HRProjectController extends Controller
{
    public function index(): Response
    {
        $projects = Project::with(['creator', 'client'])
            ->orderByRaw("FIELD(status, 'active', 'upcoming', 'completed', 'cancelled')")
            ->latest()
            ->get()
            ->map(fn($p) => [
                'id'             => $p->id,
                'name'           => $p->name,
                'description'    => $p->description,
                'status'         => $p->status,
                'start_date'     => $p->start_date?->format('Y-m-d'),
                'end_date'       => $p->end_date?->format('Y-m-d'),
                'contract_value' => $p->contract_value,
                'currency'       => $p->currency,
                'est_team_size'  => $p->est_team_size,
                'client_id'      => $p->client_id,
                'client'         => $p->client ? [
                    'id'           => $p->client->id,
                    'company_name' => $p->client->company_name,
                    'country'      => $p->client->country,
                ] : null,
                'created_by' => $p->creator?->name,
                'created_at' => $p->created_at?->format('Y-m-d'),
                'client_name' => $p->client_name, 
            ]);

        $currencies = \App\Models\PayrollCurrency::where('is_active', true)
            ->orderBy('currency_code')
            ->get(['currency_code', 'currency_name']);

        $clients = Client::orderBy('company_name')
            ->get(['id', 'company_name', 'country']);

        return Inertia::render('HR/Projects/Index', [
            'projects' => $projects,
            'clients'  => $clients,
            'currencies' => $currencies,
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
            'client_id'      => 'nullable|exists:clients,id',
            'contract_value' => 'nullable|numeric|min:0',
            'currency'       => 'nullable|string|max:10',
            'est_team_size'  => 'nullable|integer|min:1|max:999',
            'client_name' => 'nullable|string|max:255',
        ]);

        Project::create([
            ...$validated,
            'created_by' => Auth::id(),
            'currency'   => $validated['currency'] ?? 'USD',
        ]);

        return back()->with('success', 'Project created successfully.');
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'status'         => 'required|in:upcoming,active,completed,cancelled',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after_or_equal:start_date',
            'client_id'      => 'nullable|exists:clients,id',
            'contract_value' => 'nullable|numeric|min:0',
            'currency'       => 'nullable|string|max:10',
            'est_team_size'  => 'nullable|integer|min:1|max:999',
            'client_name' => 'nullable|string|max:255',
        ]);

        $project->update($validated);

        return back()->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project)
    {
        if ($project->assignments()->whereIn('status', ['active', 'upcoming'])->exists()) {
            return back()->with('error', 'Cannot delete — project has active or upcoming assignments.');
        }

        $project->delete();

        return back()->with('success', 'Project deleted successfully.');
    }
}