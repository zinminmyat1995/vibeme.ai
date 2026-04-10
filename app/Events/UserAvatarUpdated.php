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
        public ?string $avatarUrl
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];

        // ── ဒီ user ပါဝင်တဲ့ conversation channels အားလုံးကို broadcast ──
        // (conversation ထဲမှာ ရှိတဲ့ တဖက် user တွေ receive ရမယ်)
        $conversationIds = \App\Models\ConversationMember::where('user_id', $this->userId)
            ->pluck('conversation_id');

        foreach ($conversationIds as $convId) {
            $channels[] = new PrivateChannel("conversation.{$convId}");
        }

        // conversation မရှိသေးရင် user channel ထည့်
        if (empty($channels)) {
            $channels[] = new PrivateChannel("user.{$this->userId}");
        }

        return $channels;
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