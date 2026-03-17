<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $conversationData;
    public int $targetUserId;

    public function __construct(array $conversationData, int $targetUserId)
    {
        $this->conversationData = $conversationData;
        $this->targetUserId     = $targetUserId;
    }

    public function broadcastOn(): array
    {
        // Broadcast to the target user's private channel
        return [new PrivateChannel("user.{$this->targetUserId}")];
    }

    public function broadcastAs(): string
    {
        return 'conversation.created';
    }

    public function broadcastWith(): array
    {
        return ['conversation' => $this->conversationData];
    }
}