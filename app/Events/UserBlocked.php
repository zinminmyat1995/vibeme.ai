<?php
namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserBlocked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $conversationId,
        public int $targetUserId,   // blocked ခံရသူ
        public bool $isBlocked      // true=block, false=unblock
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("user.{$this->targetUserId}")];
    }

    public function broadcastAs(): string { return 'user.blocked'; }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'is_blocked'      => $this->isBlocked,
        ];
    }
}