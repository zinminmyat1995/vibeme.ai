<?php

namespace App\Mail;

use App\Models\JobInterview;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public JobInterview $interview
    ) {}

    public function envelope(): Envelope
    {
        $company = $this->interview->application->jobPosting->office->company_name;
        $title   = $this->interview->application->jobPosting->title;

        return new Envelope(
            subject: "Interview Invitation — {$title} at {$company}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.interview-invitation',
        );
    }
}