<?php
namespace App\Services;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SurveyService
{
    private string $model = 'claude-sonnet-4-20250514';

    // ═══════════════════════════════════════
    //  Create Survey + Questions
    // ═══════════════════════════════════════
    public function create(array $data, int $createdBy): Survey
    {
        $survey = Survey::create([
            'country_id'   => $data['country_id']  ?? null,
            'created_by'   => $createdBy,
            'title'        => $data['title'],
            'description'  => $data['description'] ?? null,
            'status'       => $data['status']       ?? 'draft',
            'is_anonymous' => $data['is_anonymous'] ?? false,
            'closes_at'    => isset($data['closes_at']) ? Carbon::parse($data['closes_at']) : null,
        ]);

        $this->syncQuestions($survey, $data['questions'] ?? []);

        return $survey->load('questions');
    }

    // ═══════════════════════════════════════
    //  Update Survey + Questions
    // ═══════════════════════════════════════
    public function update(Survey $survey, array $data): Survey
    {
        $survey->update([
            'title'        => $data['title'],
            'description'  => $data['description'] ?? null,
            'status'       => $data['status']       ?? $survey->status,
            'is_anonymous' => $data['is_anonymous'] ?? $survey->is_anonymous,
            'closes_at'    => isset($data['closes_at']) ? Carbon::parse($data['closes_at']) : null,
        ]);

        $this->syncQuestions($survey, $data['questions'] ?? []);

        return $survey->load('questions');
    }

    // ═══════════════════════════════════════
    //  Sync Questions (create/update/delete)
    // ═══════════════════════════════════════
    private function syncQuestions(Survey $survey, array $questions): void
    {
        $existingIds = $survey->questions()->pluck('id')->toArray();
        $incomingIds = [];

        // First pass — create/update without depends_on (avoid FK issues)
        $questionMap = []; // temp index → real id
        foreach ($questions as $idx => $q) {
            $options = null;
            if (in_array($q['type'], ['single_choice', 'multi_choice'])) {
                $options = array_values(array_filter($q['options'] ?? []));
            } elseif ($q['type'] === 'yes_no') {
                $options = ['Yes', 'No'];
            } elseif ($q['type'] === 'rating') {
                $options = ['1', '2', '3', '4', '5'];
            }

            if (!empty($q['id'])) {
                $question = SurveyQuestion::find($q['id']);
                if ($question && $question->survey_id === $survey->id) {
                    $question->update([
                        'order'                  => $idx,
                        'question'               => $q['question'],
                        'type'                   => $q['type'],
                        'options'                => $options,
                        'is_required'            => $q['is_required'] ?? true,
                        'depends_on_question_id' => null, // reset first
                        'depends_on_answer'      => null,
                    ]);
                    $incomingIds[] = $question->id;
                    $questionMap[$idx] = $question->id;
                }
            } else {
                $question = SurveyQuestion::create([
                    'survey_id'              => $survey->id,
                    'order'                  => $idx,
                    'question'               => $q['question'],
                    'type'                   => $q['type'],
                    'options'                => $options,
                    'is_required'            => $q['is_required'] ?? true,
                    'depends_on_question_id' => null,
                    'depends_on_answer'      => null,
                ]);
                $incomingIds[] = $question->id;
                $questionMap[$idx] = $question->id;
            }
        }

        // Second pass — set depends_on_question_id using real IDs
        foreach ($questions as $idx => $q) {
            if (
                isset($q['depends_on_question_index'])
                && $q['depends_on_question_index'] !== null
                && isset($questionMap[$q['depends_on_question_index']])
            ) {
                SurveyQuestion::find($questionMap[$idx])?->update([
                    'depends_on_question_id' => $questionMap[$q['depends_on_question_index']],
                    'depends_on_answer'      => $q['depends_on_answer'] ?? null,
                ]);
            }
        }

        // Delete removed questions
        $toDelete = array_diff($existingIds, $incomingIds);
        if ($toDelete) {
            SurveyQuestion::whereIn('id', $toDelete)->delete();
        }
    }

    // ═══════════════════════════════════════
    //  Submit Response
    // ═══════════════════════════════════════
    public function submitResponse(Survey $survey, array $answers, ?int $userId, string $ip, string $userAgent, int $completionSeconds): SurveyResponse
    {
        return SurveyResponse::create([
            'survey_id'          => $survey->id,
            'respondent_id'      => $survey->is_anonymous ? null : $userId,
            'answers'            => $answers, // [question_id => answer]
            'ip_address'         => $ip,
            'user_agent'         => $userAgent,
            'completion_seconds' => $completionSeconds,
        ]);
    }

    // ═══════════════════════════════════════
    //  Check Already Responded
    // ═══════════════════════════════════════
    public function hasResponded(Survey $survey, ?int $userId, string $ip): bool
    {
        if (!$survey->is_anonymous && $userId) {
            return SurveyResponse::where('survey_id', $survey->id)
                ->where('respondent_id', $userId)
                ->exists();
        }
        // Anonymous — check by IP
        return SurveyResponse::where('survey_id', $survey->id)
            ->where('ip_address', $ip)
            ->exists();
    }

    // ═══════════════════════════════════════
    //  Results Analytics
    // ═══════════════════════════════════════
    public function getResults(Survey $survey): array
    {
        $responses  = $survey->responses()->get();
        $questions  = $survey->questions()->get();
        $totalResp  = $responses->count();

        $avgSeconds = $responses->avg('completion_seconds');

        $questionResults = $questions->map(function ($q) use ($responses, $totalResp) {
            $answers = $responses->map(fn($r) => $r->getAnswer($q->id))->filter();

            return match($q->type) {
                'single_choice', 'yes_no' => $this->analyzeChoice($q, $answers, $totalResp),
                'multi_choice'            => $this->analyzeMultiChoice($q, $answers, $totalResp),
                'rating'                  => $this->analyzeRating($q, $answers, $totalResp),
                'text'                    => $this->analyzeText($q, $answers, $totalResp),
                default                   => [],
            };
        });

        return [
            'total_responses'   => $totalResp,
            'avg_completion_sec'=> $avgSeconds ? (int) $avgSeconds : null,
            'questions'         => $questionResults->toArray(),
        ];
    }

    private function analyzeChoice($q, $answers, int $total): array
    {
        $counts = [];
        foreach ($answers as $a) {
            $counts[$a] = ($counts[$a] ?? 0) + 1;
        }
        $breakdown = [];
        foreach ($q->getDefaultOptions() as $opt) {
            $c = $counts[$opt] ?? 0;
            $breakdown[] = [
                'label' => $opt,
                'count' => $c,
                'pct'   => $total > 0 ? round($c / $total * 100, 1) : 0,
            ];
        }
        return ['question' => $q->question, 'type' => $q->type, 'breakdown' => $breakdown, 'answered' => count($answers)];
    }

    private function analyzeMultiChoice($q, $answers, int $total): array
    {
        $counts = [];
        foreach ($answers as $answerArr) {
            foreach ((array) $answerArr as $a) {
                $counts[$a] = ($counts[$a] ?? 0) + 1;
            }
        }
        $breakdown = [];
        foreach ($q->options ?? [] as $opt) {
            $c = $counts[$opt] ?? 0;
            $breakdown[] = ['label' => $opt, 'count' => $c, 'pct' => $total > 0 ? round($c / $total * 100, 1) : 0];
        }
        return ['question' => $q->question, 'type' => $q->type, 'breakdown' => $breakdown, 'answered' => count($answers)];
    }

    private function analyzeRating($q, $answers, int $total): array
    {
        $nums  = $answers->map(fn($a) => (int)$a)->filter(fn($a) => $a >= 1 && $a <= 5);
        $avg   = $nums->count() > 0 ? round($nums->avg(), 2) : null;
        $dist  = [];
        for ($i = 1; $i <= 5; $i++) {
            $c = $nums->filter(fn($n) => $n === $i)->count();
            $dist[] = ['star' => $i, 'count' => $c, 'pct' => $total > 0 ? round($c / $total * 100, 1) : 0];
        }
        return ['question' => $q->question, 'type' => 'rating', 'avg' => $avg, 'distribution' => $dist, 'answered' => count($answers)];
    }

    private function analyzeText($q, $answers, int $total): array
    {
        return ['question' => $q->question, 'type' => 'text', 'answers' => $answers->values()->toArray(), 'answered' => count($answers)];
    }

    // ═══════════════════════════════════════
    //  AI Insight Generation
    // ═══════════════════════════════════════
    public function generateInsight(Survey $survey): string
    {
        $results   = $this->getResults($survey);
        $questions = $survey->questions()->get();

        $summaryLines = [];
        foreach ($results['questions'] as $qr) {
            $line = "Q: {$qr['question']} (type: {$qr['type']}, answered: {$qr['answered']})";
            if ($qr['type'] === 'text') {
                $samples = array_slice($qr['answers'], 0, 10);
                $line .= "\nSample answers: " . implode(' | ', $samples);
            } elseif ($qr['type'] === 'rating') {
                $line .= "\nAvg rating: {$qr['avg']}/5";
                foreach ($qr['distribution'] as $d) {
                    $line .= "\n  ★{$d['star']}: {$d['count']} ({$d['pct']}%)";
                }
            } else {
                foreach ($qr['breakdown'] ?? [] as $b) {
                    $line .= "\n  {$b['label']}: {$b['count']} ({$b['pct']}%)";
                }
            }
            $summaryLines[] = $line;
        }

        $surveyData = implode("\n\n", $summaryLines);

        $prompt = <<<PROMPT
You are an HR analyst. Analyze this employee survey results and provide actionable insights.

Survey: {$survey->title}
Total Responses: {$results['total_responses']}

Results:
{$surveyData}

Provide:
1. Overall sentiment summary (1-2 sentences)
2. Key findings (3-4 bullet points with specific data)
3. Areas of concern (if any)
4. Recommendations (2-3 actionable items)

Be concise, data-driven, and professional. Plain text only, no markdown asterisks.
PROMPT;

        try {
            $response = Http::withHeaders([
                'x-api-key'         => config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
                'model'      => $this->model,
                'max_tokens' => 800,
                'messages'   => [['role' => 'user', 'content' => $prompt]],
            ]);

            if ($response->successful()) {
                $insight = $response->json()['content'][0]['text'] ?? '';
                if ($insight) {
                    $survey->update([
                        'ai_insight'                => $insight,
                        'ai_insight_generated_at'   => now(),
                    ]);
                    return $insight;
                }
            }
        } catch (\Exception $e) {
            Log::error('SurveyService: AI insight failed', ['error' => $e->getMessage()]);
        }

        return 'Unable to generate insight at this time. Please try again.';
    }

    // ═══════════════════════════════════════
    //  Export CSV
    // ═══════════════════════════════════════
    public function exportCsv(Survey $survey): string
    {
        $questions = $survey->questions()->get();
        $responses = $survey->responses()->with('respondent')->get();

        $headers = ['Response #', 'Submitted At', 'Completion (sec)'];
        if (!$survey->is_anonymous) $headers[] = 'Respondent';
        foreach ($questions as $q) $headers[] = $q->question;

        $rows = [$headers];
        foreach ($responses as $i => $resp) {
            $row = [$i + 1, $resp->submitted_at->format('Y-m-d H:i'), $resp->completion_seconds ?? ''];
            if (!$survey->is_anonymous) $row[] = $resp->respondent?->name ?? 'Unknown';
            foreach ($questions as $q) {
                $ans = $resp->getAnswer($q->id);
                $row[] = is_array($ans) ? implode(', ', $ans) : ($ans ?? '');
            }
            $rows[] = $row;
        }

        $csv = '';
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn($cell) => '"' . str_replace('"', '""', $cell) . '"', $row)) . "\n";
        }
        return $csv;
    }

    // ═══════════════════════════════════════
    //  Stats for Summary Cards
    // ═══════════════════════════════════════
    public function getStats(?int $countryId): array
    {
        $q = Survey::query();
        if ($countryId) $q->where('country_id', $countryId);

        return [
            'total'    => $q->count(),
            'active'   => (clone $q)->where('status', 'active')->count(),
            'draft'    => (clone $q)->where('status', 'draft')->count(),
            'closed'   => (clone $q)->where('status', 'closed')->count(),
            'responses'=> SurveyResponse::whereIn('survey_id', (clone $q)->pluck('id'))->count(),
        ];
    }
}