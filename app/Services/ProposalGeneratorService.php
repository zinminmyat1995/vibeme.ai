<?php

namespace App\Services;

use App\Models\Proposal;
use App\Models\RequirementAnalysis;

class ProposalGeneratorService
{
    // ══════════════════════════════════════════════
    // TO SWITCH TO REAL API (takes 10 minutes):
    // 1. Uncomment the useRealAPI() method below
    // 2. Change generateContent() to call useRealAPI()
    // 3. Add ANTHROPIC_API_KEY to .env
    // ══════════════════════════════════════════════

    public function generate(RequirementAnalysis $req, string $language = 'english'): array
    {
        // ── Easy API Switch Point ──────────────────
        // return $this->useRealAPI($req, $language);
        return $this->generateContent($req, $language);
    }

    // ── REAL API METHOD (uncomment when ready) ────
    /*
    private function useRealAPI(RequirementAnalysis $req, string $language): array
    {
        $prompt = $this->buildPrompt($req, $language);

        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->timeout(90)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4000,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        $text = $response->json('content.0.text', '{}');
        $text = preg_replace('/```json|```/', '', $text);
        if (preg_match('/\{.*\}/s', $text, $m)) $text = $m[0];
        $result = json_decode(trim($text), true);
        return $result ?? $this->generateContent($req, $language);
    }

    private function buildPrompt(RequirementAnalysis $req, string $language): string
    {
        $ai = $req->ai_analysis ?? [];
        $lang = ucfirst($language);
        return <<<EOT
You are a senior business consultant. Generate a professional project proposal in {$lang} language.
Based on: Title={$req->project_title}, Client={$req->client->company_name}, Platform={$req->platform}, Budget={$req->budget_range}
AI Analysis: Complexity={$ai['project_complexity']}, Duration={$ai['estimated_duration']}, Score={$ai['feasibility_score']}
Return ONLY JSON with: executive_summary, proposed_solution, scope_of_work (array), technical_approach, project_timeline (phases array), investment_breakdown (items array with name/cost/percentage), total_investment, team_overview (array), terms_and_conditions (array), validity_period, company_strengths (array), next_steps (array)
EOT;
    }
    */

    // ── MOCK DATA GENERATOR ───────────────────────
    private function generateContent(RequirementAnalysis $req, string $language): array
    {
        $ai        = $req->ai_analysis ?? [];
        $client    = optional($req->client);
        $title     = $req->project_title ?? 'Software Project';
        $platform  = ucfirst($req->platform ?? 'web');
        $budget    = $req->budget_range ?? '$15,000 – $50,000';
        $duration  = $ai['estimated_duration'] ?? '3–4 months';
        $complexity= $ai['project_complexity'] ?? 'medium';
        $score     = $ai['feasibility_score'] ?? 85;
        $modules   = $ai['core_modules'] ?? [];
        $team      = $ai['team_structure'] ?? [];
        $phases    = $ai['timeline_phases'] ?? [];
        $techStack = $ai['recommended_tech_stack'] ?? ['React.js', 'Laravel', 'MySQL'];

        $translations = $this->getTranslations($language);
        $t = $translations;

        // Investment breakdown
        $investment = $this->calculateInvestment($budget, $complexity, $platform);

        // Executive summary per language
        $summaries = [
            'english'    => "We are pleased to present this comprehensive proposal for the {$title} project. Based on our thorough analysis of your requirements, we are confident in our ability to deliver a {$complexity}-level {$platform} solution that meets your business objectives within the proposed timeline and budget. Our team brings extensive experience in developing similar systems, ensuring quality, reliability, and scalability.",
            'myanmar'    => "{$title} project အတွက် ဤ proposal ကို တင်ပြရသည့်အတွက် ဝမ်းမြောက်ပါသည်။ သင်၏ requirements များကို ပြည့်စုံစွာ သုံးသပ်ပြီးနောက်၊ သတ်မှတ်ထားသော timeline နှင့် budget အတွင်း {$platform} system ကို အောင်မြင်စွာ ပေးအပ်နိုင်ရန် ယုံကြည်မှု ရှိပါသည်။",
            'khmer'      => "យើងសូមជូនដំណឹងអំពីសំណើរសម្រាប់គម្រោង {$title}។ បន្ទាប់ពីការវិភាគទូលំទូលាយនៃតម្រូវការរបស់អ្នក យើងមានទំនុកចិត្តក្នុងការផ្តល់ប្រព័ន្ធ {$platform} ដែលឆ្លើយតបនឹងគោលបំណងអាជីវកម្មរបស់អ្នក។",
            'vietnamese' => "Chúng tôi vui mừng trình bày đề xuất toàn diện cho dự án {$title}. Dựa trên phân tích kỹ lưỡng về yêu cầu của bạn, chúng tôi tự tin vào khả năng cung cấp giải pháp {$platform} đáp ứng mục tiêu kinh doanh trong thời hạn và ngân sách đề xuất.",
            'korean'     => "{$title} 프로젝트에 대한 포괄적인 제안서를 제출하게 되어 기쁩니다. 귀하의 요구사항을 철저히 분석한 결과, 제안된 일정과 예산 내에서 비즈니스 목표를 달성하는 {$platform} 솔루션을 제공할 수 있다고 확신합니다.",
            'japanese'   => "{$title}プロジェクトの包括的な提案書をご提出できることを嬉しく思います。お客様の要件を徹底的に分析した結果、提案されたスケジュールと予算内でビジネス目標を達成する{$platform}ソリューションを提供できると確信しております。",
        ];

        $summary = $summaries[$language] ?? $summaries['english'];

        // Scope of work from modules
        $scope = array_map(fn($m) => [
            'item'        => $m['name'] ?? 'Module',
            'description' => $m['description'] ?? '',
            'priority'    => $m['priority'] ?? 'medium',
        ], array_slice($modules, 0, 8));

        if (empty($scope)) {
            $scope = [
                ['item' => 'System Architecture & Setup',    'description' => 'Infrastructure setup, environment configuration, CI/CD pipeline.',               'priority' => 'high'],
                ['item' => 'User Authentication & Security', 'description' => 'Secure login, registration, RBAC, 2FA, and session management.',                  'priority' => 'high'],
                ['item' => 'Core Business Logic',            'description' => 'Primary features and workflows as per client requirements.',                       'priority' => 'high'],
                ['item' => 'Dashboard & Reporting',          'description' => 'Analytics dashboard, KPI metrics, and exportable reports.',                        'priority' => 'medium'],
                ['item' => 'Testing & Quality Assurance',    'description' => 'Unit, integration, and UAT testing with bug fixes.',                               'priority' => 'medium'],
                ['item' => 'Deployment & Documentation',     'description' => 'Production deployment, user manual, and technical documentation.',                 'priority' => 'medium'],
            ];
        }

        // Team overview
        $teamOverview = array_map(fn($m) => [
            'role'         => $m['role'],
            'count'        => $m['count'],
            'responsibility' => $m['reason'],
        ], $team);

        if (empty($teamOverview)) {
            $teamOverview = [
                ['role' => 'Project Manager',    'count' => 1, 'responsibility' => 'Project oversight, client communication, timeline management.'],
                ['role' => 'Backend Developer',  'count' => 2, 'responsibility' => 'API development, database design, server-side logic.'],
                ['role' => 'Frontend Developer', 'count' => 2, 'responsibility' => 'UI implementation, responsive design, user experience.'],
                ['role' => 'QA Engineer',        'count' => 1, 'responsibility' => 'Testing, quality assurance, bug tracking.'],
            ];
        }

        return [
            'proposal_number'     => 'PROP-' . date('Y') . '-' . str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT),
            'generated_at'        => now()->format('d F Y'),
            'validity_period'     => '30 days from proposal date',
            'language'            => $language,
            'executive_summary'   => $summary,
            'proposed_solution'   => "Our proposed solution for {$title} is a custom-built {$platform} application leveraging modern technologies including " . implode(', ', array_slice($techStack, 0, 4)) . ". The solution will be scalable, secure, and maintainable, designed to grow with your business needs. We will follow agile development methodology with bi-weekly client reviews to ensure alignment throughout the project.",
            'scope_of_work'       => $scope,
            'technical_approach'  => [
                'methodology'  => 'Agile / Scrum with 2-week sprints',
                'tech_stack'   => $techStack,
                'architecture' => $complexity === 'enterprise' ? 'Microservices Architecture' : 'MVC Monolithic Architecture',
                'hosting'      => 'Cloud-based (AWS / DigitalOcean)',
                'security'     => 'SSL/TLS, Data Encryption, OWASP compliance',
                'testing'      => 'Unit Tests, Integration Tests, UAT',
            ],
            'project_timeline'    => !empty($phases) ? $phases : [
                ['phase' => 'Phase 1', 'name' => 'Discovery & Planning',  'duration' => '1–2 weeks',  'deliverables' => ['Requirements doc', 'Architecture design', 'Project plan']],
                ['phase' => 'Phase 2', 'name' => 'Design & Development',  'duration' => '6–8 weeks',  'deliverables' => ['UI/UX design', 'Core features', 'API development']],
                ['phase' => 'Phase 3', 'name' => 'Testing & Launch',      'duration' => '2 weeks',    'deliverables' => ['QA testing', 'Bug fixes', 'Production deployment']],
            ],
            'investment_breakdown'=> $investment['breakdown'],
            'total_investment'    => $investment['total'],
            'payment_terms'       => [
                '30% upfront upon contract signing',
                '40% upon completion of core development (Phase 2)',
                '30% upon final delivery and client acceptance',
            ],
            'team_overview'       => $teamOverview,
            'company_strengths'   => [
                '5+ years of enterprise software development experience',
                'Portfolio of 50+ successfully delivered projects',
                'Dedicated post-launch support and maintenance',
                'Agile methodology ensuring on-time delivery',
                'Full transparency with regular progress updates',
            ],
            'terms_and_conditions'=> [
                'All source code and intellectual property will be fully transferred to the client upon final payment.',
                'The proposal is valid for 30 days from the date of issue.',
                '3 months of post-launch bug-fix support included at no additional cost.',
                'Change requests beyond agreed scope will be assessed and quoted separately.',
                'Client is responsible for providing timely feedback within 3 business days.',
            ],
            'next_steps'          => [
                'Review and approve this proposal',
                'Sign the project contract and NDA',
                'Make initial 30% payment to commence work',
                'Schedule kickoff meeting with the development team',
                'Begin discovery and requirements finalization phase',
            ],
        ];
    }

    private function calculateInvestment(string $budget, string $complexity, string $platform): array
    {
        $budgetMap = [
            '< $5,000'            => ['min' => 3000,  'max' => 5000],
            '$5,000 – $15,000'    => ['min' => 5000,  'max' => 15000],
            '$15,000 – $50,000'   => ['min' => 15000, 'max' => 50000],
            '$50,000 – $100,000'  => ['min' => 50000, 'max' => 100000],
            '> $100,000'          => ['min' => 100000,'max' => 150000],
        ];

        $range = $budgetMap[$budget] ?? ['min' => 10000, 'max' => 30000];
        $total = ($range['min'] + $range['max']) / 2;

        $breakdown = [
            ['name' => 'UI/UX Design & Prototyping',    'percentage' => 15, 'cost' => round($total * 0.15)],
            ['name' => 'Frontend Development',           'percentage' => 25, 'cost' => round($total * 0.25)],
            ['name' => 'Backend Development & APIs',     'percentage' => 30, 'cost' => round($total * 0.30)],
            ['name' => 'Testing & Quality Assurance',    'percentage' => 10, 'cost' => round($total * 0.10)],
            ['name' => 'Project Management',             'percentage' => 10, 'cost' => round($total * 0.10)],
            ['name' => 'Deployment & Infrastructure',    'percentage' => 5,  'cost' => round($total * 0.05)],
            ['name' => 'Documentation & Training',       'percentage' => 5,  'cost' => round($total * 0.05)],
        ];

        if (in_array($platform, ['mobile', 'both'])) {
            $breakdown[] = ['name' => 'Mobile Development', 'percentage' => 20, 'cost' => round($total * 0.20)];
        }

        return [
            'breakdown' => $breakdown,
            'total'     => '$' . number_format($total),
        ];
    }

    private function getTranslations(string $language): array
    {
        $translations = [
            'english' => [
                'proposal_title'   => 'Project Proposal',
                'prepared_for'     => 'Prepared For',
                'prepared_by'      => 'Prepared By',
                'date'             => 'Date',
                'valid_until'      => 'Valid Until',
                'exec_summary'     => 'Executive Summary',
                'proposed_sol'     => 'Proposed Solution',
                'scope'            => 'Scope of Work',
                'technical'        => 'Technical Approach',
                'timeline'         => 'Project Timeline',
                'investment'       => 'Investment Breakdown',
                'team'             => 'Our Team',
                'terms'            => 'Terms & Conditions',
                'next_steps'       => 'Next Steps',
                'total'            => 'Total Investment',
                'accept'           => 'Accept Proposal',
            ],
            'myanmar' => [
                'proposal_title'   => 'စီမံကိန်း အဆိုပြုလွှာ',
                'prepared_for'     => 'တင်ပြသူ',
                'prepared_by'      => 'ပြင်ဆင်သူ',
                'date'             => 'နေ့စွဲ',
                'valid_until'      => 'သက်တမ်း',
                'exec_summary'     => 'အကျဉ်းချုပ်',
                'proposed_sol'     => 'အဆိုပြုထားသော ဖြေရှင်းချက်',
                'scope'            => 'လုပ်ဆောင်မည့် နယ်ပယ်',
                'technical'        => 'နည်းပညာ ချဉ်းကပ်မှု',
                'timeline'         => 'စီမံကိန်း အချိန်ဇယား',
                'investment'       => 'ရင်းနှီးမြှုပ်နှံမှု အသေးစိတ်',
                'team'             => 'ကျွန်ုပ်တို့ အဖွဲ့',
                'terms'            => 'သတ်မှတ်ချက်များ',
                'next_steps'       => 'နောက်လုပ်ဆောင်မည့် အဆင့်များ',
                'total'            => 'စုစုပေါင်း ရင်းနှီးမြှုပ်နှံမှု',
                'accept'           => 'အဆိုပြုလွှာ လက်ခံသည်',
            ],
            'khmer' => [
                'proposal_title'   => 'សំណើគម្រោង',
                'prepared_for'     => 'រៀបចំសម្រាប់',
                'prepared_by'      => 'រៀបចំដោយ',
                'date'             => 'កាលបរិច្ឆេទ',
                'valid_until'      => 'មានសុពលភាព',
                'exec_summary'     => 'សង្ខេបប្រតិបត្តិ',
                'proposed_sol'     => 'ដំណោះស្រាយដែលបានស្នើ',
                'scope'            => 'វិសាលភាពការងារ',
                'technical'        => 'វិធីសាស្ត្របច្ចេកទេស',
                'timeline'         => 'កាលវិភាគគម្រោង',
                'investment'       => 'ការវិនិយោគ',
                'team'             => 'ក្រុមការងាររបស់យើង',
                'terms'            => 'លក្ខខណ្ឌ',
                'next_steps'       => 'ជំហានបន្ទាប់',
                'total'            => 'ការវិនិយោគសរុប',
                'accept'           => 'ទទួលយកសំណើ',
            ],
        ];

        return $translations[$language] ?? $translations['english'];
    }
}