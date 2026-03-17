<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {
        // Force load relationships BEFORE serialization
        $this->message->load('sender', 'replyTo.sender');
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        $sender = $this->message->getRelation('sender');

        return [
            'message' => [
                'id'              => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'sender_id'       => $this->message->sender_id,
                'sender'          => [
                    'id'         => $sender?->id,
                    'name'       => $sender?->name,
                    'avatar_url' => $sender?->avatar_url ?? null,
                ],
                'type'       => $this->message->type,
                'body'       => $this->message->body,
                'file_path'  => $this->message->file_path,
                'file_name'  => $this->message->file_name,
                'file_size'  => $this->message->file_size,
                'mime_type'  => $this->message->mime_type,
                'file_url'   => $this->message->file_url,
                'reply_to'   => $this->message->replyTo ? [
                    'id'          => $this->message->replyTo->id,
                    'body'        => $this->message->replyTo->body,
                    'type'        => $this->message->replyTo->type ?? 'text',
                    'sender_name' => $this->message->replyTo->sender?->name,
                ] : null,
                'reactions'  => [],
                'is_edited'  => false,
                'created_at' => $this->message->created_at->toISOString(),
                'status'     => 'sent',
            ],
        ];
    }
}