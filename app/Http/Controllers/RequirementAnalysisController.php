<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\RequirementAnalysis;
use App\Services\AIAnalysisService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequirementAnalysisController extends Controller
{
    public function index()
    {
        $analyses = RequirementAnalysis::with(['client', 'createdBy'])
            ->latest()
            ->get();

        $stats = [
            'total'     => $analyses->count(),
            'pending'   => $analyses->where('status', 'pending')->count(),
            'analyzing' => $analyses->where('status', 'analyzing')->count(),
            'completed' => $analyses->where('status', 'completed')->count(),
            'failed'    => $analyses->where('status', 'failed')->count(),
        ];

        return Inertia::render('RequirementAnalysis', [
            'analyses' => $analyses,
            'clients'  => Client::orderBy('company_name')->get(),
            'stats'    => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'company_name'          => 'required|string|max:255',
            'contact_person'        => 'required|string|max:255',
            'email'                 => 'nullable|email',
            'phone'                 => 'nullable|string|max:50',
            'industry'              => 'nullable|string|max:255',
            'project_title'         => 'required|string|max:255',
            'project_description'   => 'required|string',
            'core_features'         => 'nullable|array',
            'platform'              => 'required|in:web,mobile,both,desktop',
            'expected_users'        => 'nullable|integer|min:0',
            'integration_needs'     => 'nullable|string',
            'budget_range'          => 'nullable|string',
            'expected_deadline'     => 'nullable|date',
            'special_requirements'  => 'nullable|string',
        ]);

        // Create or find client
        $client = Client::create([
            'company_name'   => $request->company_name,
            'contact_person' => $request->contact_person,
            'email'          => $request->email,
            'phone'          => $request->phone,
            'industry'       => $request->industry,
        ]);

        // Create requirement
        $analysis = RequirementAnalysis::create([
            'client_id'            => $client->id,
            'created_by'           => auth()->id(),
            'project_title'        => $request->project_title,
            'project_description'  => $request->project_description,
            'core_features'        => $request->core_features ?? [],
            'platform'             => $request->platform,
            'expected_users'       => $request->expected_users ?? 0,
            'integration_needs'    => $request->integration_needs,
            'budget_range'         => $request->budget_range,
            'expected_deadline'    => $request->expected_deadline,
            'special_requirements' => $request->special_requirements,
            'status'               => 'pending',
        ]);

        // Run AI analysis
        try {
            $analysis->update(['status' => 'analyzing']);
            $result = (new AIAnalysisService())->analyze($analysis);
            $analysis->update([
                'status'      => 'completed',
                'ai_analysis' => $result,
            ]);
        } catch (\Exception $e) {
            $analysis->update(['status' => 'failed']);
        }

        return back()->with('success', 'Requirement analyzed successfully!');
    }

    public function show(RequirementAnalysis $analysis)
    {
        $analysis->load(['client', 'createdBy']);

        return Inertia::render('RequirementDetail', [
            'analysis' => $analysis,
        ]);
    }

    public function destroy(RequirementAnalysis $analysis)
    {
        $analysis->delete();
        return back()->with('success', 'Requirement deleted successfully!');
    }

    public function reanalyze(RequirementAnalysis $analysis)
    {
        try {
            $analysis->update(['status' => 'analyzing']);
            $result = (new AIAnalysisService())->analyze($analysis);
            $analysis->update([
                'status'      => 'completed',
                'ai_analysis' => $result,
            ]);
        } catch (\Exception $e) {
            $analysis->update(['status' => 'failed']);
        }

        return back()->with('success', 'Re-analysis completed!');
    }
}