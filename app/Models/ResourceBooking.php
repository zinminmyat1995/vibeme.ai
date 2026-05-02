<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceBooking extends Model
{
    protected $fillable = [
        'resource_id',
        'user_id',
        'booking_date',
        'start_time',
        'end_time',
        'purpose',
        'is_open_ended',
        'returned_at',
        'status',
        'reject_reason',
        'approved_by',
        'approved_at',
        // ── အသစ် ──
        'trip_type',
        'pickup_location',
        'driver_status',
        'driver_note',
        'has_return', 'return_time',

        'cancelled_by',
        'cancelled_by_role',
        'cancel_reason',
        'cancelled_at',
    ];

    protected $casts = [
        'booking_date'  => 'date',
        'is_open_ended' => 'boolean',
        'returned_at'   => 'datetime',
        'approved_at'   => 'datetime',
    ];

    // relation ထပ်ထည့် (attendees() အောက်မှာ)
    public function stops(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingStop::class, 'booking_id')->orderBy('order');
    }

    // ── Relations ──────────────────────────

    public function resource(): BelongsTo
    {
        return $this->belongsTo(BookableResource::class, 'resource_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function attendees(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingAttendee::class, 'booking_id')
                    ->with('user:id,name,avatar_url');
    }

    // ── Status Helpers ─────────────────────

    public function isPending(): bool     { return $this->status === 'pending'; }
    public function isApproved(): bool    { return $this->status === 'approved'; }
    public function isRejected(): bool    { return $this->status === 'rejected'; }
    public function isCancelled(): bool   { return $this->status === 'cancelled'; }
    public function isWaitlisted(): bool  { return $this->status === 'waitlisted'; }
    public function isCompleted(): bool   { return $this->status === 'completed'; }

    /**
     * Car ငှားပြီး ပြန်ရောက်ပြီးလား
     */
    public function isReturned(): bool
    {
        return $this->returned_at !== null;
    }

    /**
     * Time display — "09:00 - 11:00" သို့မဟုတ် "09:00 - Open ended"
     */
    public function timeDisplay(): string
    {
        $start = substr($this->start_time, 0, 5);
        $end   = $this->end_time ? substr($this->end_time, 0, 5) : 'Open ended';
        return "{$start} - {$end}";
    }

    // ── Scopes ─────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('booking_date', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->whereDate('booking_date', '>=', today());
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function driverNotes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingDriverNote::class, 'booking_id')
                    ->orderBy('created_at');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}