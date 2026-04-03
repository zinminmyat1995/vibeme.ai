<?php

namespace App\Mail;

use App\Models\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public JobApplication $application,
        public string $status           // 'reviewing' | 'accepted' | 'rejected'
    ) {}

    public function envelope(): Envelope
    {
        $title   = $this->application->jobPosting->title;
        $company = $this->application->jobPosting->office->company_name;

        $subjects = [
            'reviewing' => "We received your application — {$title} at {$company}",
            'accepted'  => "Congratulations! You've been selected — {$title} at {$company}",
            'rejected'  => "Your application update — {$title} at {$company}",
        ];

        return new Envelope(
            subject: $subjects[$this->status] ?? "Application Update — {$title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.application-status',
        );
    }
}