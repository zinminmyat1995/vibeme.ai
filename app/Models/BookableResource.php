<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookableResource extends Model
{
    protected $fillable = [
        'country_id',
        'type',
        'name',
        'location',
        'capacity',
        'rules',
        'plate_number',
        'photo',
        'driver_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'capacity'  => 'integer',
    ];

    // ── Relations ──────────────────────────

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(ResourceBooking::class, 'resource_id');
    }

    // ── Helpers ────────────────────────────

    public function isRoom(): bool { return $this->type === 'room'; }
    public function isCar(): bool  { return $this->type === 'car'; }

    /**
     * ဒီနေ့ approved bookings တွေ
     */
    public function todayBookings()
    {
        return $this->bookings()
            ->whereDate('booking_date', today())
            ->whereIn('status', ['approved'])
            ->orderBy('start_time')
            ->with('user:id,name,avatar_url');
    }

    /**
     * Open-ended booking ရှိနေလား (car only)
     * ရှိရင် → waitlist mode
     */
    public function hasOpenEndedBooking(): bool
    {
        return $this->bookings()
            ->where('is_open_ended', true)
            ->where('status', 'approved')
            ->whereNull('returned_at')
            ->exists();
    }

    /**
     * Conflict check — တူတဲ့ date + time overlap ရှိလား
     */
    public function hasConflict(string $date, string $startTime, string $endTime, ?int $excludeId = null): bool
    {
        return $this->bookings()
            ->whereDate('booking_date', $date)
            ->whereIn('status', ['approved', 'pending'])
            ->where('is_open_ended', false)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($q2) use ($startTime, $endTime) {
                    // existing booking ရဲ့ အတွင်းမှာ ဝင်နေတဲ့ case
                    $q2->where('start_time', '<', $endTime)
                       ->where('end_time', '>', $startTime);
                });
            })
            ->exists();
    }

    /**
     * Waitlist — open-ended ပြီးသွားရင် notify မဲ့ next booking
     */
    public function nextWaitlisted(): ?ResourceBooking
    {
        return $this->bookings()
            ->where('status', 'waitlisted')
            ->orderBy('created_at')
            ->first();
    }
}