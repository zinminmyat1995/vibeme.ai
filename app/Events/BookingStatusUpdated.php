<?php

namespace App\Events;

use App\Models\ResourceBooking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $bookingId,
        public readonly string $driverStatus,
        public readonly int    $countryId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('bookings.' . $this->countryId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'booking.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'booking_id'    => $this->bookingId,
            'driver_status' => $this->driverStatus,
        ];
    }
}