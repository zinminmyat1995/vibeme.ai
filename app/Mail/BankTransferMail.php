<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BankTransferMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $companyName,
        public string $periodLabel,
        public string $currency,
        public float  $totalAmount,
        public int    $employeeCount,
        public string $pdfPath,
        public string $pdfFilename,
        public string $generatedAt,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->companyName}] Bank Transfer Request — {$this->periodLabel}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.bank_transfer',
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->pdfPath)
                ->as($this->pdfFilename)
                ->withMime('application/pdf'),
        ];
    }
}