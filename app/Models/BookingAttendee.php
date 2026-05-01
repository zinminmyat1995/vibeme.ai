<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAttendee extends Model
{
    protected $fillable = [
        'booking_id',
        'user_id',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ResourceBooking::class, 'booking_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}