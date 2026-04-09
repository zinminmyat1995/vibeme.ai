<?php

namespace Database\Seeders;

use App\Models\MailTemplate;
use Illuminate\Database\Seeder;

class MailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name'             => 'Meeting Request',
                'slug'             => 'meeting_request',
                'icon'             => '📅',
                'category'         => 'meeting',
                'subject_template' => 'Meeting Request: {topic}',
                'body_template'    => '<div style="font-family:\'Segoe UI\',Georgia,sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e;">
  <div style="border-left:4px solid #7c3aed;padding:4px 0 4px 20px;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#7c3aed;">Meeting Request</p>
    <h2 style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">{topic}</h2>
  </div>
  <p style="margin:0 0 18px;font-size:15px;color:#374151;">Dear <strong>{recipient}</strong>,</p>
  <p style="margin:0 0 22px;font-size:15px;color:#4b5563;line-height:1.8;">I hope this message finds you well. I would like to request a meeting to discuss <strong style="color:#0f172a;">{topic}</strong> and would appreciate the opportunity to connect at your earliest convenience.</p>
  <p style="margin:0 0 6px;font-size:15px;color:#4b5563;line-height:1.8;">The proposed details are as follows:</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">📅 &nbsp;<strong style="color:#0f172a;">Date &amp; Time</strong> &nbsp;— &nbsp;{date}</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">📍 &nbsp;<strong style="color:#0f172a;">Location</strong> &nbsp;— &nbsp;{location}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">⏱ &nbsp;<strong style="color:#0f172a;">Duration</strong> &nbsp;— &nbsp;{duration}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;">Please feel free to confirm your availability by replying to this email. If the suggested time does not suit you, I am happy to accommodate an alternative that works better for your schedule.</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;">Warm regards,</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">{sender}</p>
</div>',
                'variables' => ['recipient', 'topic', 'date', 'location', 'duration', 'sender'],
            ],

            [
                'name'             => 'Leave Request',
                'slug'             => 'leave_request',
                'icon'             => '🏖️',
                'category'         => 'hr',
                'subject_template' => 'Leave Request — {leave_type} ({from_date} to {to_date})',
                'body_template'    => '<div style="font-family:\'Segoe UI\',Georgia,sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e;">
  <div style="border-left:4px solid #059669;padding:4px 0 4px 20px;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#059669;">Leave Request</p>
    <h2 style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">{leave_type}</h2>
  </div>
  <p style="margin:0 0 18px;font-size:15px;color:#374151;">Dear <strong>{recipient}</strong>,</p>
  <p style="margin:0 0 22px;font-size:15px;color:#4b5563;line-height:1.8;">I am writing to formally request <strong style="color:#0f172a;">{leave_type}</strong>. I have planned accordingly to ensure a smooth handover and minimal disruption to ongoing work during my absence.</p>
  <p style="margin:0 0 6px;font-size:15px;color:#4b5563;line-height:1.8;">Details of my leave request:</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">📋 &nbsp;<strong style="color:#0f172a;">Leave Type</strong> &nbsp;— &nbsp;{leave_type}</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">📅 &nbsp;<strong style="color:#0f172a;">From</strong> &nbsp;— &nbsp;{from_date}</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">📅 &nbsp;<strong style="color:#0f172a;">To</strong> &nbsp;— &nbsp;{to_date}</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">⏰ &nbsp;<strong style="color:#0f172a;">Session</strong> &nbsp;— &nbsp;{session}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">📝 &nbsp;<strong style="color:#0f172a;">Reason</strong> &nbsp;— &nbsp;{reason}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;">I kindly request your approval at the earliest convenience. Please do not hesitate to reach out should you require any further information.</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;">Sincerely,</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">{sender}</p>
</div>',
                'variables' => ['recipient', 'leave_type', 'from_date', 'to_date', 'session', 'reason', 'sender'],
            ],

            [
                'name'             => 'Task Assignment',
                'slug'             => 'task_assignment',
                'icon'             => '✅',
                'category'         => 'project',
                'subject_template' => 'Task Assignment: {task_name}',
                'body_template'    => '<div style="font-family:\'Segoe UI\',Georgia,sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e;">
  <div style="border-left:4px solid #d97706;padding:4px 0 4px 20px;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#d97706;">Task Assignment</p>
    <h2 style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">{task_name}</h2>
  </div>
  <p style="margin:0 0 18px;font-size:15px;color:#374151;">Dear <strong>{recipient}</strong>,</p>
  <p style="margin:0 0 22px;font-size:15px;color:#4b5563;line-height:1.8;">I hope you are doing well. I am writing to formally assign you the following task and to share the key details you will need to get started.</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">📌 &nbsp;<strong style="color:#0f172a;">Task</strong> &nbsp;— &nbsp;{task_name}</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">⏰ &nbsp;<strong style="color:#0f172a;">Deadline</strong> &nbsp;— &nbsp;<span style="color:#dc2626;font-weight:700;">{deadline}</span></p>
  <p style="margin:0 0 22px;font-size:15px;color:#4b5563;padding-left:16px;border-left:2px solid #e5e7eb;line-height:2;">🎯 &nbsp;<strong style="color:#0f172a;">Priority</strong> &nbsp;— &nbsp;{priority}</p>
  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Task Description</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;padding-left:16px;border-left:2px solid #e5e7eb;">{description}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;">Please acknowledge receipt of this assignment by replying to this message. Do not hesitate to reach out if you have any questions or require additional resources.</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;">Best regards,</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">{sender}</p>
</div>',
                'variables' => ['recipient', 'task_name', 'deadline', 'priority', 'description', 'sender'],
            ],

            [
                'name'             => 'Report Submission',
                'slug'             => 'report_submission',
                'icon'             => '📈',
                'category'         => 'general',
                'subject_template' => '{report_type} Report — {period}',
                'body_template'    => '<div style="font-family:\'Segoe UI\',Georgia,sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e;">
  <div style="border-left:4px solid #2563eb;padding:4px 0 4px 20px;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;">Report Submission</p>
    <h2 style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">{report_type} — {period}</h2>
  </div>
  <p style="margin:0 0 18px;font-size:15px;color:#374151;">Dear <strong>{recipient}</strong>,</p>
  <p style="margin:0 0 22px;font-size:15px;color:#4b5563;line-height:1.8;">Please find attached the <strong style="color:#0f172a;">{report_type}</strong> report covering the period of <strong style="color:#0f172a;">{period}</strong> for your review and reference.</p>
  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Key Highlights</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;padding-left:16px;border-left:2px solid #e5e7eb;">{highlights}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;">Please take a moment to review the report at your convenience. I am available to discuss the findings or provide further clarification should you need it.</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;">Best regards,</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">{sender}</p>
</div>',
                'variables' => ['recipient', 'report_type', 'period', 'highlights', 'sender'],
            ],

            [
                'name'             => 'Announcement',
                'slug'             => 'announcement',
                'icon'             => '📢',
                'category'         => 'general',
                'subject_template' => 'Announcement: {title}',
                'body_template'    => '<div style="font-family:\'Segoe UI\',Georgia,sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e;">
  <div style="border-left:4px solid #7c3aed;padding:4px 0 4px 20px;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#7c3aed;">Announcement</p>
    <h2 style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">{title}</h2>
  </div>
  <p style="margin:0 0 18px;font-size:15px;color:#374151;">Dear Team,</p>
  <p style="margin:0 0 22px;font-size:15px;color:#4b5563;line-height:1.8;">We are pleased to share the following important announcement. Please take a moment to read the details below carefully.</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;padding-left:16px;border-left:2px solid #e5e7eb;">{details}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;">📅 &nbsp;This announcement takes effect on <strong style="color:#0f172a;">{effective_date}</strong>.</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;">Should you have any questions or require further clarification, please do not hesitate to reach out to HR or your direct manager.</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;">Best regards,</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">{sender}</p>
</div>',
                'variables' => ['title', 'details', 'effective_date', 'sender'],
            ],

            [
                'name'             => 'Partnership Proposal',
                'slug'             => 'partnership_proposal',
                'icon'             => '🤝',
                'category'         => 'general',
                'subject_template' => 'Partnership Proposal: {company_name}',
                'body_template'    => '<div style="font-family:\'Segoe UI\',Georgia,sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e;">
  <div style="border-left:4px solid #0f172a;padding:4px 0 4px 20px;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#475569;">Partnership Proposal</p>
    <h2 style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">{our_company} &times; {company_name}</h2>
  </div>
  <p style="margin:0 0 18px;font-size:15px;color:#374151;">Dear <strong>{recipient}</strong>,</p>
  <p style="margin:0 0 22px;font-size:15px;color:#4b5563;line-height:1.8;">I hope this message finds you well. I am reaching out on behalf of <strong style="color:#0f172a;">{our_company}</strong> to explore a potential partnership opportunity with <strong style="color:#0f172a;">{company_name}</strong> that we believe could be mutually beneficial.</p>
  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Proposal Overview</p>
  <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.8;padding-left:16px;border-left:2px solid #e5e7eb;">{overview}</p>
  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Mutual Benefits</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;padding-left:16px;border-left:2px solid #e5e7eb;">{benefits}</p>
  <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.8;">We would be delighted to schedule a meeting at your convenience to discuss this proposal in greater detail. Please feel free to reply to this email or propose a suitable time for a call.</p>
  <p style="margin:0 0 4px;font-size:15px;color:#4b5563;">With warm regards,</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">{sender}</p>
</div>',
                'variables' => ['recipient', 'our_company', 'company_name', 'overview', 'benefits', 'sender'],
            ],
        ];

        foreach ($templates as $template) {
            MailTemplate::updateOrCreate(['slug' => $template['slug']], $template);
        }

        MailTemplate::whereIn('slug', ['job_offer', 'project_update'])->delete();
    }
}