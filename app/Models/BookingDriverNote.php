<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingDriverNote extends Model
{
    protected $fillable = [
        'booking_id',
        'driver_id',
        'trip_date',
        'trip_start_time',
        'trip_end_time',
        'trip_purpose',
        'note',
    ];

    protected $casts = [
        'trip_date' => 'date',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ResourceBooking::class, 'booking_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}