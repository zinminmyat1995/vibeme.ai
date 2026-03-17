<?php

namespace App\Services;

use App\Models\RequirementAnalysis;

class AIAnalysisService
{
    public function analyze(RequirementAnalysis $req): array
    {
        $users     = (int) ($req->expected_users ?? 0);
        $features  = is_array($req->core_features) ? $req->core_features : [];
        $featCount = count($features);
        $desc      = strtolower($req->project_description ?? '');
        $title     = $req->project_title ?? 'This Project';
        $platform  = $req->platform ?? 'web';
        $budget    = $req->budget_range ?? '';
        $deadline  = $req->expected_deadline;

        // ── Complexity Scoring ────────────────────────────────
        $score = 0;
        if ($users > 1000)           $score += 3;
        elseif ($users > 100)        $score += 2;
        else                         $score += 1;

        if ($featCount >= 8)         $score += 3;
        elseif ($featCount >= 4)     $score += 2;
        else                         $score += 1;

        if (str_contains($desc, 'payment'))          $score += 2;
        if (str_contains($desc, 'real-time'))        $score += 2;
        if (str_contains($desc, 'realtime'))         $score += 2;
        if (str_contains($desc, 'ai'))               $score += 3;
        if (str_contains($desc, 'machine learning')) $score += 3;
        if (str_contains($desc, 'integration'))      $score += 1;
        if (str_contains($desc, 'multi'))            $score += 1;
        if (str_contains($desc, 'report'))           $score += 1;
        if (str_contains($desc, 'analytics'))        $score += 1;
        if ($req->integration_needs)                 $score += 1;
        if (in_array($platform, ['both', 'mobile'])) $score += 1;

        $complexity = match(true) {
            $score >= 10 => 'enterprise',
            $score >= 7  => 'complex',
            $score >= 4  => 'medium',
            default      => 'simple',
        };

        // ── Feasibility Score ─────────────────────────────────
        $daysLeft = $deadline
            ? now()->diffInDays(\Carbon\Carbon::parse($deadline), false)
            : 180;

        $feasibility = match($complexity) {
            'enterprise' => 65,
            'complex'    => 75,
            'medium'     => 84,
            default      => 92,
        };

        if ($daysLeft < 30)  $feasibility -= 20;
        elseif ($daysLeft < 60)  $feasibility -= 10;
        elseif ($daysLeft < 90)  $feasibility -= 5;

        if (str_contains($budget, '< $5,000') && in_array($complexity, ['complex', 'enterprise'])) $feasibility -= 10;

        $feasibility = max(25, min(96, $feasibility));

        // ── Duration ──────────────────────────────────────────
        $duration = match($complexity) {
            'enterprise' => '8–14 months',
            'complex'    => '4–7 months',
            'medium'     => '2–4 months',
            default      => '3–6 weeks',
        };

        // ── Timeline Feasibility ──────────────────────────────
        $timelineFeasibility = 'feasible';
        if ($daysLeft < 30)      $timelineFeasibility = 'unrealistic';
        elseif ($daysLeft < 60)  $timelineFeasibility = 'tight';

        // ── Budget Assessment ─────────────────────────────────
        $budgetAssessment = 'within';
        $budgetNotes = "The {$budget} budget is well-aligned with the project scope and complexity level. With proper planning and agile delivery, the project can be completed within budget.";

        if (str_contains($budget, '< $5,000') && in_array($complexity, ['complex', 'enterprise'])) {
            $budgetAssessment = 'under';
            $budgetNotes = "The {$budget} budget appears insufficient for a {$complexity}-level project. We recommend either increasing the budget or reducing the initial scope to an MVP. A phased delivery approach would be the most practical solution.";
        } elseif (str_contains($budget, '> $100,000') && $complexity === 'simple') {
            $budgetAssessment = 'over';
            $budgetNotes = "The budget significantly exceeds typical costs for this project complexity. This allows for premium quality, extended support, comprehensive documentation, and future enhancements.";
        }

        // ── Summary ───────────────────────────────────────────
        $clientName  = optional($req->client)->company_name ?? 'the client';
        $platformStr = ucfirst($platform);
        $summary = "{$title} is a {$complexity}-level {$platformStr} system developed for {$clientName}. "
            . "Based on the requirements analysis, this project is estimated to take {$duration} with an overall feasibility score of {$feasibility}/100. "
            . "The system is designed to serve " . ($users > 0 ? number_format($users) : 'multiple') . " concurrent users "
            . "and requires careful attention to " . ($score > 8 ? 'scalability, performance, and security' : 'functionality, usability, and reliability') . ". "
            . "A structured agile development approach with clear milestones is strongly recommended for successful and on-time delivery.";

        // ── Tech Stack ────────────────────────────────────────
        $techStack = match($platform) {
            'mobile'  => ['React Native', 'Node.js / Express', 'PostgreSQL', 'Firebase', 'REST API', 'AWS'],
            'both'    => ['React.js', 'React Native', 'Laravel / PHP', 'MySQL', 'Redis', 'AWS S3'],
            'desktop' => ['Electron.js', 'Vue.js', 'Python / FastAPI', 'PostgreSQL', 'REST API'],
            default   => ['React.js', 'Laravel / PHP', 'MySQL', 'Redis', 'AWS S3', 'REST API'],
        };

        if (str_contains($desc, 'payment'))     $techStack[] = 'Stripe / PayPal API';
        if (str_contains($desc, 'chat') || str_contains($desc, 'real-time')) $techStack[] = 'WebSocket / Pusher';
        if (str_contains($desc, 'map'))         $techStack[] = 'Google Maps API';
        if (str_contains($desc, 'ai'))          $techStack[] = 'Python / TensorFlow';
        if (str_contains($desc, 'sms'))         $techStack[] = 'Twilio SMS API';
        if ($complexity === 'enterprise')       $techStack[] = 'Docker / Kubernetes';

        // ── Core Modules ──────────────────────────────────────
        $modules = [
            ['name' => 'User Authentication & Authorization', 'description' => 'Secure login, registration, password reset, email verification, and role-based access control (RBAC) to ensure only authorized users can access specific features.', 'priority' => 'high'],
            ['name' => 'Dashboard & Analytics',               'description' => 'Central command center displaying KPIs, interactive charts, real-time metrics, and data visualizations to support informed decision-making.', 'priority' => 'high'],
            ['name' => 'Core Business Module',                'description' => "Primary business logic handling {$title}'s main operations including data management, workflow processing, and CRUD operations.", 'priority' => 'high'],
            ['name' => 'Notification System',                 'description' => 'Multi-channel notification system supporting in-app alerts, email notifications, and push notifications for real-time updates.', 'priority' => 'medium'],
            ['name' => 'Reporting & Export',                  'description' => 'Comprehensive reporting engine with PDF and Excel export capabilities, date range filtering, and customizable report templates.', 'priority' => 'medium'],
            ['name' => 'User Management',                     'description' => 'Admin panel for managing users, assigning roles, monitoring activity, enabling/disabling accounts, and maintaining audit logs.', 'priority' => 'medium'],
            ['name' => 'Search & Filter Engine',              'description' => 'Advanced search functionality with multi-parameter filtering, sorting, pagination, and real-time search suggestions.', 'priority' => 'low'],
            ['name' => 'Settings & Configuration',            'description' => 'System-wide configuration management, user preferences, and application parameter controls.', 'priority' => 'low'],
        ];

        if (str_contains($desc, 'payment') || in_array('Payment Integration', $features)) {
            array_splice($modules, 2, 0, [['name' => 'Payment & Billing', 'description' => 'Secure payment processing with multiple payment methods, invoice generation, transaction history, and refund management.', 'priority' => 'high']]);
        }
        if (str_contains($desc, 'stock') || str_contains($desc, 'inventory')) {
            array_splice($modules, 2, 0, [['name' => 'Inventory Management', 'description' => 'Real-time stock tracking, low stock alerts, product categorization, supplier management, and purchase order management.', 'priority' => 'high']]);
        }
        if (str_contains($desc, 'order') || str_contains($desc, 'product')) {
            array_splice($modules, 2, 0, [['name' => 'Order & Product Management', 'description' => 'End-to-end order lifecycle management with product catalog, order tracking, status updates, and fulfillment workflow.', 'priority' => 'high']]);
        }

        $maxModules = match($complexity) { 'enterprise' => 8, 'complex' => 7, 'medium' => 6, default => 5 };
        $modules = array_slice($modules, 0, $maxModules);

        // ── Risks ─────────────────────────────────────────────
        $risks = [];

        if ($daysLeft < 60) {
            $risks[] = ['risk' => 'Tight Delivery Timeline', 'level' => 'high', 'mitigation' => 'Prioritize MVP features for initial launch. Use parallel development tracks and daily standups to maximize output and catch blockers early.'];
        }
        if (in_array($complexity, ['complex', 'enterprise'])) {
            $risks[] = ['risk' => 'Technical Complexity',    'level' => 'high', 'mitigation' => 'Conduct technical spike sessions in Week 1. Assign senior developers to critical modules and create proof-of-concept for complex integrations.'];
        }
        if (str_contains($budget, '< $5,000') && $complexity !== 'simple') {
            $risks[] = ['risk' => 'Budget Insufficiency',    'level' => 'high', 'mitigation' => 'Negotiate phased payment milestones. Deliver core MVP within budget, then plan subsequent phases for remaining features.'];
        }

        $risks[] = ['risk' => 'Scope Creep',                 'level' => 'medium', 'mitigation' => 'Establish a formal change request process with client sign-off before development begins. Any new features require impact assessment.'];
        $risks[] = ['risk' => 'Data Security & Privacy',     'level' => 'medium', 'mitigation' => 'Implement end-to-end encryption, regular security audits, GDPR-compliant data handling, and penetration testing before launch.'];
        $risks[] = ['risk' => 'Third-party API Dependency',  'level' => 'low',    'mitigation' => 'Implement fallback mechanisms for critical APIs. Monitor service status pages and identify alternative providers.'];
        $risks[] = ['risk' => 'Performance Bottlenecks',     'level' => $users > 500 ? 'medium' : 'low', 'mitigation' => 'Implement Redis caching, database query optimization, CDN for static assets, and load testing before go-live.'];

        // ── Team ──────────────────────────────────────────────
        $team = [
            ['role' => 'Project Manager',    'count' => 1, 'reason' => 'Oversee timeline, manage stakeholder communication, and ensure on-time delivery within scope.'],
            ['role' => 'Backend Developer',  'count' => in_array($complexity, ['complex', 'enterprise']) ? 2 : 1, 'reason' => 'Design and implement server-side logic, database architecture, REST APIs, and core business logic.'],
            ['role' => 'Frontend Developer', 'count' => in_array($complexity, ['complex', 'enterprise']) ? 2 : 1, 'reason' => 'Build responsive UI components, implement design system, and ensure cross-browser compatibility.'],
            ['role' => 'QA Engineer',        'count' => 1, 'reason' => 'Conduct functional, regression, and performance testing with comprehensive bug tracking throughout the development lifecycle.'],
        ];

        if (in_array($platform, ['mobile', 'both'])) {
            $team[] = ['role' => 'Mobile Developer',  'count' => 1, 'reason' => 'Develop and optimize cross-platform mobile application for both iOS and Android platforms.'];
        }
        if (in_array($complexity, ['complex', 'enterprise'])) {
            $team[] = ['role' => 'UI/UX Designer',    'count' => 1, 'reason' => 'User research, wireframing, prototyping, and creating a cohesive and intuitive design system.'];
            $team[] = ['role' => 'DevOps Engineer',   'count' => 1, 'reason' => 'CI/CD pipeline setup, cloud infrastructure management, deployment automation, and system monitoring.'];
        }

        // ── Phases ────────────────────────────────────────────
        $phases = match($complexity) {
            'enterprise', 'complex' => [
                ['phase' => 'Phase 1', 'name' => 'Discovery & Requirements',   'duration' => '2–3 weeks',  'deliverables' => ['Final Requirements Document', 'System Architecture', 'Database Schema', 'Project Roadmap']],
                ['phase' => 'Phase 2', 'name' => 'UI/UX Design',               'duration' => '2–3 weeks',  'deliverables' => ['Wireframes', 'Design System', 'Interactive Prototype', 'Client Approval']],
                ['phase' => 'Phase 3', 'name' => 'Core Development',           'duration' => '6–8 weeks',  'deliverables' => ['Authentication System', 'Core APIs', 'Database Implementation', 'Base UI']],
                ['phase' => 'Phase 4', 'name' => 'Feature Development',        'duration' => '6–10 weeks', 'deliverables' => ['All Business Modules', 'Third-party Integrations', 'Admin Panel', 'Notifications']],
                ['phase' => 'Phase 5', 'name' => 'Testing & Quality Assurance','duration' => '2–3 weeks',  'deliverables' => ['Full Test Reports', 'Bug Fixes', 'Performance Testing', 'Security Audit']],
                ['phase' => 'Phase 6', 'name' => 'Deployment & Handover',      'duration' => '1–2 weeks',  'deliverables' => ['Production Deployment', 'User Documentation', 'Training', 'Support Handover']],
            ],
            'medium' => [
                ['phase' => 'Phase 1', 'name' => 'Planning & Design',          'duration' => '1–2 weeks',  'deliverables' => ['Requirements Sign-off', 'Wireframes', 'Database Design']],
                ['phase' => 'Phase 2', 'name' => 'Core Development',           'duration' => '4–6 weeks',  'deliverables' => ['Backend APIs', 'Frontend UI', 'Authentication', 'Core Features']],
                ['phase' => 'Phase 3', 'name' => 'Feature Completion',         'duration' => '3–4 weeks',  'deliverables' => ['All Features', 'Integrations', 'Admin Panel', 'Reports']],
                ['phase' => 'Phase 4', 'name' => 'Testing & Launch',           'duration' => '1–2 weeks',  'deliverables' => ['Full Testing', 'Bug Fixes', 'Deployment', 'Go-Live']],
            ],
            default => [
                ['phase' => 'Phase 1', 'name' => 'Planning & Setup',           'duration' => '3–5 days',   'deliverables' => ['Requirements', 'Environment Setup', 'Design Mockup']],
                ['phase' => 'Phase 2', 'name' => 'Development',                'duration' => '2–3 weeks',  'deliverables' => ['Core Features', 'UI Implementation', 'Unit Testing']],
                ['phase' => 'Phase 3', 'name' => 'Testing & Launch',           'duration' => '3–5 days',   'deliverables' => ['Final Testing', 'Production Deployment', 'Documentation']],
            ],
        };

        // ── Recommendations ───────────────────────────────────
        $recommendations = [
            'Conduct a formal requirements sign-off session with the client before development begins to prevent scope creep and misaligned expectations.',
            'Implement CI/CD pipeline from day one to ensure consistent, reliable, and automated deployments throughout the development lifecycle.',
            'Adopt agile methodology with 2-week sprints, daily standups, and bi-weekly client demos for continuous feedback and course correction.',
            'Prioritize security from the foundation — implement authentication, data encryption, input validation, and rate limiting as core infrastructure.',
        ];

        if ($complexity === 'enterprise') {
            $recommendations[] = 'Consider microservices architecture to enable independent scaling of high-traffic components and improve system resilience.';
            $recommendations[] = 'Implement comprehensive observability with centralized logging, performance monitoring, and real-time alerting from day one.';
        }
        if ($users > 500) {
            $recommendations[] = 'Implement Redis caching, database indexing, and CDN distribution to ensure optimal performance under high concurrent user load.';
        }
        if ($daysLeft < 90) {
            $recommendations[] = 'Given the timeline constraints, deliver a focused MVP first, then plan post-launch iterations for additional functionality.';
        }
        if (str_contains($budget, '< $5,000')) {
            $recommendations[] = 'Maximize development efficiency by leveraging proven open-source frameworks and pre-built UI component libraries to reduce build time.';
        }

        // ── Clarifications ────────────────────────────────────
        $clarifications = [
            'What are the specific user roles required, and what permissions and capabilities should each role have within the system?',
            'Are there any existing systems, databases, or legacy software that need to be integrated with or migrated to the new platform?',
            'What are the expected peak concurrent users, response time requirements, and uptime SLA expectations?',
            'Are there specific compliance or regulatory requirements to consider (GDPR, HIPAA, local data protection laws)?',
            'What is the preferred deployment environment — cloud provider (AWS/GCP/Azure), managed hosting, or on-premise infrastructure?',
            'Will you require ongoing maintenance, feature updates, and technical support after the initial project delivery?',
        ];

        if (!$req->integration_needs) {
            $clarifications[] = 'Do you require integration with third-party services such as payment gateways, SMS providers, email services, or ERP/CRM systems?';
        }

        return [
            'summary'                => $summary,
            'project_complexity'     => $complexity,
            'feasibility_score'      => $feasibility,
            'estimated_duration'     => $duration,
            'recommended_tech_stack' => $techStack,
            'core_modules'           => $modules,
            'potential_risks'        => $risks,
            'clarification_needed'   => $clarifications,
            'team_structure'         => $team,
            'budget_assessment'      => $budgetAssessment,
            'budget_notes'           => $budgetNotes,
            'recommendations'        => $recommendations,
            'timeline_feasibility'   => $timelineFeasibility,
            'timeline_phases'        => $phases,
        ];
    }
}