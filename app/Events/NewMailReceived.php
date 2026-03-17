<?php

namespace App\Events;

use App\Models\Mail;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMailReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Mail $mail) {}

    // ── Realtime: private channel per user ──
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->mail->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'new-mail';
    }

    public function broadcastWith(): array
    {
        return [
            'id'           => $this->mail->id,
            'from_name'    => $this->mail->from_name,
            'from_address' => $this->mail->from_address,
            'subject'      => $this->mail->subject,
            'mail_date'    => $this->mail->mail_date?->format('d M Y H:i'),
        ];
    }
}