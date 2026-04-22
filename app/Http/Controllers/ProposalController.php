<?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use App\Models\RequirementAnalysis;
use App\Services\ProposalGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ProposalController extends Controller
{
    public function index()
    {
        $proposals = Proposal::with(['requirementAnalysis.client', 'createdBy'])
            ->latest()->get();

        $stats = [
            'total'    => $proposals->count(),
            'draft'    => $proposals->where('status', 'draft')->count(),
            'sent'     => $proposals->where('status', 'sent')->count(),
            'accepted' => $proposals->where('status', 'accepted')->count(),
            'rejected' => $proposals->where('status', 'rejected')->count(),
        ];

        $analyses = RequirementAnalysis::with('client')
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('ProposalGenerator', [
            'proposals' => $proposals,
            'analyses'  => $analyses,
            'stats'     => $stats,
        ]);
    }

    
    public function store(Request $request)
    {
        $request->validate([
            'requirement_analysis_id' => 'required|exists:requirement_analyses,id',
            'language'                => 'required|in:english',
            'template'                => 'nullable|in:executive,magazine,minimal',
        ]);

        $analysis = RequirementAnalysis::with('client')
            ->findOrFail($request->requirement_analysis_id);

        $content = (new ProposalGeneratorService())->generate($analysis, $request->language);
        $content['template'] = $request->template ?? 'executive';

        $proposal = Proposal::create([
            'requirement_analysis_id' => $analysis->id,
            'created_by'              => auth()->id(),
            'proposal_number'         => $content['proposal_number'],
            'language'                => $request->language,
            'status'                  => 'draft',
            'content'                 => $content,
        ]);

        return redirect()->route('proposal.show', $proposal->id)
            ->with('success', 'Proposal generated! 🎉');
    }

    public function show(Proposal $proposal)
    {
        $proposal->load(['requirementAnalysis.client', 'createdBy']);
        return Inertia::render('ProposalDetail', ['proposal' => $proposal]);
    }

    // Blade preview — iframe src (auth required)
    public function preview(Proposal $proposal, string $template = null)
    {
        $proposal->load(['requirementAnalysis.client']);
        $template = $template ?? $proposal->content['template'] ?? 'executive';
        if (!in_array($template, ['executive', 'magazine', 'minimal'])) {
            $template = 'executive';
        }

        return response()->view("proposals.templates.{$template}", [
            'proposal' => $proposal,
            'content'  => $proposal->content,
            'analysis' => $proposal->requirementAnalysis,
            'client'   => $proposal->requirementAnalysis->client,
        ]);
    }

    // DomPDF download
    public function downloadPDF(Proposal $proposal, string $template = null)
    {
        $proposal->load(['requirementAnalysis.client']);
        $template = $template ?? $proposal->content['template'] ?? 'executive';
        if (!in_array($template, ['executive', 'magazine', 'minimal'])) {
            $template = 'executive';
        }

        $pdf = Pdf::loadView("proposals.templates.{$template}", [
            'proposal' => $proposal,
            'content'  => $proposal->content,
            'analysis' => $proposal->requirementAnalysis,
            'client'   => $proposal->requirementAnalysis->client,
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->set_option('isHtml5ParserEnabled', true);
        $pdf->set_option('isRemoteEnabled', false);
        $pdf->set_option('defaultFont', 'DejaVu Sans');

        $filename = ($proposal->content['proposal_number'] ?? 'proposal') . "-{$template}.pdf";

        return $pdf->download($filename);
    }

    public function updateStatus(Request $request, Proposal $proposal)
    {
        $request->validate(['status' => 'required|in:draft,sent,accepted,rejected']);
        $proposal->update([
            'status'  => $request->status,
            'sent_at' => $request->status === 'sent' ? now() : $proposal->sent_at,
        ]);
        return back()->with('success', 'Status updated!');
    }

    public function destroy(Proposal $proposal)
    {
        $proposal->delete();
        return back()->with('success', 'Deleted!');
    }

    public function regenerate(Proposal $proposal)
    {
        $proposal->load('requirementAnalysis.client');
        $content = (new ProposalGeneratorService())->generate(
            $proposal->requirementAnalysis,
            $proposal->language
        );
        $content['template'] = $proposal->content['template'] ?? 'executive';
        $proposal->update(['content' => $content, 'status' => 'draft']);
        
        return redirect()->route('proposal.show', $proposal->id)  // ← back() မဟုတ်ဘဲ redirect
            ->with('success', 'Regenerated successfully!');
    }
}