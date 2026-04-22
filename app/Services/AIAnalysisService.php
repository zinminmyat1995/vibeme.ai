<?php
namespace App\Services;

use App\Models\RequirementAnalysis;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAnalysisService
{
    private string $model = 'claude-opus-4-6';
    private bool $hasApi;

    public function __construct()
    {
        $this->hasApi = !empty(config('services.anthropic.key'));
    }

    public function analyze(RequirementAnalysis $req): array
    {
        if (!$this->hasApi) {
            Log::info('⚠️ RequirementAnalysis: No API key — using mock data');
            return $this->mockAnalyze($req);
        }

        $startTime = microtime(true);

        $prompt = $this->buildPrompt($req);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->timeout(90)->post('https://api.anthropic.com/v1/messages', [
            'model'      => $this->model,
            'max_tokens' => 2048,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        $elapsed = round((microtime(true) - $startTime) * 1000);

        if (!$response->successful()) {
            Log::error('❌ RequirementAnalysis API failed', ['status' => $response->status()]);
            return $this->mockAnalyze($req);
        }

        $json  = $response->json();
        $text  = $json['content'][0]['text'] ?? '';
        $usage = $json['usage'] ?? null;

        // ── Console log ──
        if ($usage) {
            $inputCost  = ($usage['input_tokens']  / 1_000_000) * 15;
            $outputCost = ($usage['output_tokens'] / 1_000_000) * 75;
            $total      = $inputCost + $outputCost;
            Log::info("🧠 AI Requirement Analysis [{$req->project_title}]", [
                'input_tokens'  => $usage['input_tokens'],
                'output_tokens' => $usage['output_tokens'],
                'total_tokens'  => $usage['input_tokens'] + $usage['output_tokens'],
                'cost_usd'      => '$' . number_format($total, 6),
                'time_ms'       => $elapsed,
            ]);
        }
Log::info('🔍 Raw AI Response', ['text' => $text]);
        // Parse JSON response
        $clean = str_replace(['```json', '```'], '', $text);
        $clean = trim($clean);
        $result = json_decode($clean, true);

        if ($result) {
            return $result;
        }

        Log::warning('⚠️ RequirementAnalysis: Could not parse AI response, using mock');
        return $this->mockAnalyze($req);
    }

    private function buildPrompt(RequirementAnalysis $req): string
    {
        $features = implode(', ', $req->core_features ?? []);
        return <<<EOT
            You are a senior software project analyst. Analyze this project requirement and return ONLY a JSON object.

            Project: {$req->project_title}
            Description: {$req->project_description}
            Platform: {$req->platform}
            Expected Users: {$req->expected_users}
            Core Features: {$features}
            Budget: {$req->budget_range}
            Deadline: {$req->expected_deadline}
            Integration Needs: {$req->integration_needs}

            Return ONLY this JSON (no explanation, no markdown):
            {
            "project_complexity": "simple|medium|complex|enterprise",
            "feasibility_score": 85,
            "estimated_duration": "3-4 months",
            "recommended_team_size": 4,
            "risk_level": "low|medium|high",
            "summary": "2-3 sentence executive summary",
            "key_challenges": ["challenge 1", "challenge 2"],
            "tech_stack": ["Technology 1", "Technology 2"],
            "potential_risks": [
                {"risk": "Risk title", "level": "high|medium|low", "mitigation": "How to mitigate this risk"}
            ],
            "success_metrics": ["metric 1", "metric 2"],
            "core_modules": [
                {"name": "Module Name", "description": "What it does", "priority": "high|medium|low", "estimated_hours": 40}
            ],
            "timeline_phases": [
                {"phase": "Phase Name", "duration": "1-2 weeks", "tasks": ["task 1", "task 2"]}
            ]
            }
        EOT;
    }

    // ── Fallback mock ──────────────────────────────────
    private function mockAnalyze(RequirementAnalysis $req): array
    {
        $users     = (int) ($req->expected_users ?? 0);
        $features  = is_array($req->core_features) ? $req->core_features : [];
        $featCount = count($features);
        $desc      = strtolower($req->project_description ?? '');

        $score = 0;
        if ($users > 1000) $score += 3; elseif ($users > 100) $score += 2; else $score += 1;
        if ($featCount >= 8) $score += 3; elseif ($featCount >= 4) $score += 2; else $score += 1;
        if (str_contains($desc, 'payment')) $score += 2;
        if (str_contains($desc, 'real-time')) $score += 2;
        if (str_contains($desc, 'ai')) $score += 3;

        $complexity = match(true) {
            $score >= 10 => 'enterprise',
            $score >= 7  => 'complex',
            $score >= 4  => 'medium',
            default      => 'simple',
        };

        return [
            'project_complexity'     => $complexity,
            'feasibility_score'      => min(95, 60 + ($score * 2)),
            'estimated_duration'     => match($complexity) { 'enterprise' => '12-18 months', 'complex' => '6-9 months', 'medium' => '3-5 months', default => '1-3 months' },
            'recommended_team_size'  => match($complexity) { 'enterprise' => 8, 'complex' => 5, 'medium' => 3, default => 2 },
            'risk_level'             => match($complexity) { 'enterprise' => 'high', 'complex' => 'medium', default => 'low' },
            'executive_summary'      => "This is a {$complexity} {$req->platform} project requiring careful planning.",
            'key_challenges'         => ['Scope management', 'Timeline adherence'],
            'recommended_tech_stack' => ['Laravel', 'React', 'MySQL'],
            'risk_factors'           => ['Requirement changes', 'Resource availability'],
            'success_metrics'        => ['On-time delivery', 'User adoption rate'],
            'modules'                => array_map(fn($f) => ['name' => $f, 'description' => "Core {$f} functionality", 'priority' => 'high'], array_slice($features, 0, 5)),
        ];
    }
}