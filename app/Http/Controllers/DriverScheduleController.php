<?php

namespace App\Http\Controllers;

use App\Models\BookableResource;
use App\Models\BookingDriverNote;
use App\Models\Notification;
use App\Models\ResourceBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Events\BookingStatusUpdated;

class DriverScheduleController extends Controller
{
    // ═══════════════════════════════════════════════════════════════
    //  Authorize — driver သာ ဝင်ခွင့်ရှိ
    // ═══════════════════════════════════════════════════════════════

    private function authorizeDriver(): BookableResource
    {
        $car = BookableResource::where('driver_id', Auth::id())
            ->where('type', 'car')
            ->where('is_active', true)
            ->first();

        abort_unless($car, 403, 'No car assigned to you.');

        return $car;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Main Page — GET /driver/schedule
    // ═══════════════════════════════════════════════════════════════

    public function index(Request $request)
    {
        $car = BookableResource::where('driver_id', Auth::id())
            ->where('type', 'car')
            ->where('is_active', true)
            ->first();

        // Car မ assign ရသေးရင် → friendly page ပြ၊ abort မလုပ်
        if (!$car) {
            return Inertia::render('Driver/Schedule', [
                'car'      => null,
                'bookings' => [],
                'date'     => today()->toDateString(),
            ]);
        }

        $date     = $request->query('date', today()->toDateString());
        $bookings = $this->getBookingsForDate($car->id, $date);

        return Inertia::render('Driver/Schedule', [
            'car'      => [
                'id'           => $car->id,
                'name'         => $car->name,
                'plate_number' => $car->plate_number,
                'location'     => $car->location,
                'capacity'     => $car->capacity,
            ],
            'bookings' => $bookings,
            'date'     => $date,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  AJAX — Date change မှာ bookings reload
    //  GET /driver/schedule/bookings?date=2026-05-02
    // ═══════════════════════════════════════════════════════════════

    public function bookings(Request $request)
    {
        $request->validate(['date' => 'required|date']);
        $car      = $this->authorizeDriver();
        $bookings = $this->getBookingsForDate($car->id, $request->date);

        return response()->json(['bookings' => $bookings]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Driver Status Update
    //  PATCH /driver/schedule/{booking}/status
    //  body: { driver_status: 'on_the_way' | 'returned' | 'ended' }
    // ═══════════════════════════════════════════════════════════════

    public function updateStatus(Request $request, ResourceBooking $booking)
    {
        $car = $this->authorizeDriver();

        // ဒီ booking က ကိုယ့် car ရဲ့ booking ဟုတ်/မဟုတ် check
        abort_unless($booking->resource_id === $car->id, 403);
        abort_unless($booking->status === 'approved', 422);

        $request->validate([
            'driver_status' => 'required|in:on_the_way,returned,ended',
        ]);

        $newStatus = $request->driver_status;

        // Status flow validation — ကျော်လိုက်လို့မရ
        $current = $booking->driver_status;
        $allowed = match ($current) {
            'start'      => ['on_the_way'],
            'on_the_way' => ['returned'],
            'returned'   => ['ended'],
            default      => [],
        };

        abort_unless(in_array($newStatus, $allowed), 422, 'Invalid status transition.');

        $updateData = ['driver_status' => $newStatus];

        // ended ဖြစ်သွားရင် → booking completed + returned_at set
        if ($newStatus === 'ended') {
            $updateData['returned_at'] = now();
            $updateData['status']      = 'completed';

            // Waitlisted booking ရှိရင် activate
            $next = $car->nextWaitlisted();
            if ($next) {
                $next->update(['status' => 'approved']);
            }
        }

        $booking->update($updateData);

        // ── Broadcast ──
        try {
            broadcast(new BookingStatusUpdated(
                bookingId:    $booking->id,
                driverStatus: $newStatus,
                countryId:    $booking->resource->country_id,
            ));
        } catch (\Exception $e) {
            \Log::error('Broadcast failed: ' . $e->getMessage());
        }

        // Organizer ကို notify (on_the_way ဖြစ်သွားတဲ့အခါ)
        if ($newStatus === 'on_the_way') {
            $this->notifyOrganizer($booking, 'on_the_way');
        }

        // ended ဖြစ်သွားတဲ့အခါ organizer + attendees notify
        if ($newStatus === 'ended') {
            $this->notifyTripEnded($booking);
        }

        return response()->json([
            'message'       => 'Status updated.',
            'driver_status' => $newStatus,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Driver Cancel
    //  POST /driver/schedule/{booking}/cancel
    //  body: { cancel_reason: '...' }
    // ═══════════════════════════════════════════════════════════════

    public function cancel(Request $request, ResourceBooking $booking)
    {
        $car = $this->authorizeDriver();

        abort_unless($booking->resource_id === $car->id, 403);
        abort_unless(in_array($booking->status, ['approved', 'waitlisted']), 422);

        $request->validate([
            'cancel_reason' => 'required|string|max:500',
        ]);

        $booking->load(['attendees', 'resource:id,name,type', 'user:id,name']);

        $booking->update([
            'status'            => 'cancelled',
            'cancel_reason'     => $request->cancel_reason,
            'cancelled_by'      => Auth::id(),
            'cancelled_by_role' => 'driver',
            'cancelled_at'      => now(),
        ]);

        // Notify organizer + attendees
        $this->notifyCancelled($booking, $request->cancel_reason);

        return back()->with('success', 'Booking cancelled.');
    }

    // ═══════════════════════════════════════════════════════════════
    //  Driver Note Save
    //  POST /driver/schedule/{booking}/note
    //  body: { note: '...' }
    // ═══════════════════════════════════════════════════════════════

    public function storeNote(Request $request, ResourceBooking $booking)
    {
        $car = $this->authorizeDriver();

        abort_unless($booking->resource_id === $car->id, 403);
        abort_unless($booking->driver_status === 'ended', 422, 'Can only add note after trip ends.');

        $request->validate([
            'note' => 'required|string|max:1000',
        ]);

        BookingDriverNote::create([
            'booking_id'      => $booking->id,
            'driver_id'       => Auth::id(),
            'trip_date'       => $booking->booking_date,
            'trip_start_time' => $booking->start_time,
            'trip_end_time'   => $booking->end_time,
            'trip_purpose'    => $booking->purpose,
            'note'            => $request->note,
        ]);

        return response()->json(['message' => 'Note saved.']);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════════

    private function getBookingsForDate(int $carId, string $date): \Illuminate\Support\Collection
    {
        return ResourceBooking::with([
            'user:id,name,avatar_url',
            'attendees.user:id,name,avatar_url',
            'stops',
            'driverNotes',
        ])
        ->where('resource_id', $carId)
        ->whereDate('booking_date', $date)
        ->whereIn('status', ['approved', 'waitlisted', 'completed'])
        ->orderBy('start_time')
        ->get()
        ->map(fn($b) => $this->formatBooking($b));
    }

    private function formatBooking(ResourceBooking $b): array
    {
        return [
            'id'              => $b->id,
            'booking_date'    => $b->booking_date->format('Y-m-d'),
            'start_time'      => substr($b->start_time, 0, 5),
            'end_time'        => $b->end_time ? substr($b->end_time, 0, 5) : null,
            'purpose'         => $b->purpose,
            'status'          => $b->status,
            'driver_status'   => $b->driver_status,
            'is_open_ended'   => $b->is_open_ended,
            'trip_type'       => $b->trip_type,
            'pickup_location' => $b->pickup_location,
            'has_return'      => $b->has_return,
            'return_time'     => $b->return_time ? substr($b->return_time, 0, 5) : null,
            'cancel_reason'   => $b->cancel_reason,
            'cancelled_by_role' => $b->cancelled_by_role,
            'cancelled_at'    => $b->cancelled_at?->format('d M Y H:i'),
            'organizer'       => [
                'id'         => $b->user->id,
                'name'       => $b->user->name,
                'avatar_url' => $b->user->avatar_url,
            ],
            'attendees' => $b->attendees->map(fn($a) => [
                'id'         => $a->user->id,
                'name'       => $a->user->name,
                'avatar_url' => $a->user->avatar_url,
            ])->values(),
            'stops' => $b->stops->map(fn($s) => [
                'order'        => $s->order,
                'location'     => $s->location,
                'arrival_time' => $s->arrival_time ? substr($s->arrival_time, 0, 5) : null,
            ])->values(),
            'driver_notes' => $b->driverNotes->map(fn($n) => [
                'id'         => $n->id,
                'note'       => $n->note,
                'created_at' => $n->created_at->format('d M Y H:i'),
            ])->values(),
        ];
    }

    private function notifyOrganizer(ResourceBooking $booking, string $status): void
    {
        $booking->load(['resource:id,name', 'user:id,name']);
        $carName   = $booking->resource->name;
        $date      = $booking->booking_date->format('d M Y');
        $startTime = substr($booking->start_time, 0, 5);

        Notification::send(
            userId: $booking->user_id,
            type:   'driver_on_the_way',
            title:  '🚗 Driver On The Way',
            body:   "Your {$carName} booking on {$date} at {$startTime} — driver has started the trip.",
            url:    '/driver/schedule',
        );
    }

    private function notifyTripEnded(ResourceBooking $booking): void
    {
        $booking->load(['resource:id,name', 'user:id,name', 'attendees']);
        $carName   = $booking->resource->name;
        $date      = $booking->booking_date->format('d M Y');
        $startTime = substr($booking->start_time, 0, 5);

        $userIds = collect([$booking->user_id])
            ->merge($booking->attendees->pluck('user_id'))
            ->unique();

        foreach ($userIds as $userId) {
            Notification::send(
                userId: $userId,
                type:   'trip_completed',
                title:  '✅ Trip Completed',
                body:   "{$carName} booking on {$date} at {$startTime} has been completed.",
                url:    '/bookings',
            );
        }
    }

    private function notifyCancelled(ResourceBooking $booking, string $reason): void
    {
        $carName   = $booking->resource->name;
        $date      = $booking->booking_date->format('d M Y');
        $startTime = substr($booking->start_time, 0, 5);
        $driver    = Auth::user()->name;

        $userIds = collect([$booking->user_id])
            ->merge($booking->attendees->pluck('user_id'))
            ->unique();

        foreach ($userIds as $userId) {
            Notification::send(
                userId: $userId,
                type:   'booking_cancelled',
                title:  '❌ Booking Cancelled by Driver',
                body:   "{$driver} cancelled 🚗 {$carName} booking on {$date} at {$startTime}. Reason: {$reason}",
                url:    '/bookings',
            );
        }
    }
}