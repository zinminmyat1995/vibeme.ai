<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserAvatarUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int     $userId,
        public ?string $avatarUrl   // null = deleted
    ) {}

    public function broadcastOn(): array
    {
        // Broadcast to the user's own private channel
        return [new PrivateChannel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'user.avatar.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id'    => $this->userId,
            'avatar_url' => $this->avatarUrl,
        ];
    }
}