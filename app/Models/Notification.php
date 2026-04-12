<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'url',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Helpers ───────────────────────────────────────────────
    public function isUnread(): bool
    {
        return $this->read_at === null;
    }

    // ── Static factory helpers ────────────────────────────────
    // Usage: Notification::send($userId, 'leave_request', 'Leave Requested', '...', '/payroll/leaves', ['request_id' => 5])
    public static function send(
        int    $userId,
        string $type,
        string $title,
        string $body,
        string $url  = '',
        array  $data = []
    ): self {
        $notif = self::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'url'     => $url  ?: null,
            'data'    => $data ?: null,
            'read_at' => null,
        ]);

        // Broadcast real-time to private channel
        broadcast(new \App\Events\NotificationSent($notif))->toOthers();

        return $notif;
    }
}