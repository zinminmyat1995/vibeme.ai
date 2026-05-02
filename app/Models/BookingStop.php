<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingStop extends Model
{
    protected $fillable = [
        'booking_id',
        'order',
        'location',
        'arrival_time',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ResourceBooking::class, 'booking_id');
    }
}