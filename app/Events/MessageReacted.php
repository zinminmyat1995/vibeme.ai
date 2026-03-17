<?php

namespace App\Events;

use App\Models\MessageReaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReacted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly MessageReaction $reaction,
        public readonly int $conversationId,
        public readonly bool $removed = false,
        public readonly ?string $oldEmoji = null,
    ) {}

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->reaction->message_id,
            'user_id'    => $this->reaction->user_id,
            'user_name'  => $this->reaction->user?->name ?? '',   // ✅ tooltip အတွက်
            'emoji'      => $this->reaction->emoji,
            'removed'    => $this->removed,
            'old_emoji'  => $this->oldEmoji,
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.' . $this->conversationId)];
    }

    public function broadcastAs(): string
    {
        return 'message.reacted';
    }
}