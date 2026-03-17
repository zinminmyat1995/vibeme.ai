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
                'body_template'    => '<p>Dear {recipient},</p><p>I would like to schedule a meeting regarding <strong>{topic}</strong>.</p><p><strong>Date & Time:</strong> {date}<br><strong>Location:</strong> {location}<br><strong>Duration:</strong> {duration}</p><p>Please confirm your availability.</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['recipient','topic','date','location','duration','sender'],
            ],
            [
                'name'             => 'Project Update',
                'slug'             => 'project_update',
                'icon'             => '📊',
                'category'         => 'project',
                'subject_template' => 'Project Update: {project_name}',
                'body_template'    => '<p>Dear {recipient},</p><p>Here is the latest update on <strong>{project_name}</strong>.</p><p><strong>Progress:</strong> {progress}%<br><strong>Status:</strong> {status}<br><strong>Next Steps:</strong> {next_steps}</p><p>Please let me know if you have any questions.</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['recipient','project_name','progress','status','next_steps','sender'],
            ],
            [
                'name'             => 'Leave Request',
                'slug'             => 'leave_request',
                'icon'             => '🏖️',
                'category'         => 'hr',
                'subject_template' => 'Leave Request: {leave_type} ({from_date} - {to_date})',
                'body_template'    => '<p>Dear {recipient},</p><p>I am writing to request <strong>{leave_type}</strong> leave from <strong>{from_date}</strong> to <strong>{to_date}</strong>.</p><p><strong>Reason:</strong> {reason}</p><p>I will ensure all pending tasks are completed before my leave.</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['recipient','leave_type','from_date','to_date','reason','sender'],
            ],
            [
                'name'             => 'Task Assignment',
                'slug'             => 'task_assignment',
                'icon'             => '✅',
                'category'         => 'project',
                'subject_template' => 'Task Assignment: {task_name}',
                'body_template'    => '<p>Dear {recipient},</p><p>You have been assigned the following task:</p><p><strong>Task:</strong> {task_name}<br><strong>Deadline:</strong> {deadline}<br><strong>Priority:</strong> {priority}</p><p><strong>Description:</strong><br>{description}</p><p>Please acknowledge receipt of this assignment.</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['recipient','task_name','deadline','priority','description','sender'],
            ],
            [
                'name'             => 'Report Submission',
                'slug'             => 'report_submission',
                'icon'             => '📈',
                'category'         => 'general',
                'subject_template' => '{report_type} Report - {period}',
                'body_template'    => '<p>Dear {recipient},</p><p>Please find attached the <strong>{report_type}</strong> report for <strong>{period}</strong>.</p><p><strong>Key Highlights:</strong><br>{highlights}</p><p>Please review and let me know if you need any clarification.</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['recipient','report_type','period','highlights','sender'],
            ],
            [
                'name'             => 'Announcement',
                'slug'             => 'announcement',
                'icon'             => '📢',
                'category'         => 'general',
                'subject_template' => 'Announcement: {title}',
                'body_template'    => '<p>Dear Team,</p><p>We would like to announce: <strong>{title}</strong></p><p>{details}</p><p>Effective Date: {effective_date}</p><p>If you have any questions, please don\'t hesitate to reach out.</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['title','details','effective_date','sender'],
            ],
            [
                'name'             => 'Partnership Proposal',
                'slug'             => 'partnership_proposal',
                'icon'             => '🤝',
                'category'         => 'general',
                'subject_template' => 'Partnership Proposal: {company_name}',
                'body_template'    => '<p>Dear {recipient},</p><p>I am writing to propose a partnership between <strong>{our_company}</strong> and <strong>{company_name}</strong>.</p><p><strong>Proposal Overview:</strong><br>{overview}</p><p><strong>Benefits:</strong><br>{benefits}</p><p>I would love to discuss this further at your earliest convenience.</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['recipient','our_company','company_name','overview','benefits','sender'],
            ],
            [
                'name'             => 'Job Offer Letter',
                'slug'             => 'job_offer',
                'icon'             => '💼',
                'category'         => 'hr',
                'subject_template' => 'Job Offer: {position} at {company}',
                'body_template'    => '<p>Dear {candidate_name},</p><p>We are pleased to offer you the position of <strong>{position}</strong> at <strong>{company}</strong>.</p><p><strong>Start Date:</strong> {start_date}<br><strong>Salary:</strong> {salary}<br><strong>Location:</strong> {location}</p><p>Please confirm your acceptance by {deadline}.</p><p>We look forward to welcoming you to our team!</p><p>Best regards,<br>{sender}</p>',
                'variables'        => ['candidate_name','position','company','start_date','salary','location','deadline','sender'],
            ],
        ];

        foreach ($templates as $template) {
            MailTemplate::updateOrCreate(['slug' => $template['slug']], $template);
        }
    }
}