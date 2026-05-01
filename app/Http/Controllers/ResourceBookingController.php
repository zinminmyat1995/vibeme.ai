<?php

namespace App\Http\Controllers;

use App\Models\BookableResource;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ResourceBookingController extends Controller
{
    // ═══════════════════════════════════════════════════════════════
    //  Main Page
    // ═══════════════════════════════════════════════════════════════

    public function index()
    {
        $user      = Auth::user();
        $countryId = $user->country_id;
        $isHR      = $user->hasAnyRole(['hr', 'admin']);

        $resources = BookableResource::with(['driver:id,name,avatar_url'])
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->orderBy('type')->orderBy('name')
            ->get()->map(fn($r) => $this->formatResource($r));

        $pendingQuery = ResourceBooking::with(['resource:id,name,type,location,capacity', 'user:id,name,avatar_url'])
            ->whereHas('resource', fn($q) => $q->where('country_id', $countryId))
            ->where('status', 'pending')
            ->orderBy('booking_date')->orderBy('start_time');

        if (!$isHR) $pendingQuery->where('user_id', $user->id);
        $pendingBookings = $pendingQuery->get()->map(fn($b) => $this->formatBooking($b));

        $myBookings = ResourceBooking::with(['resource:id,name,type,location'])
            ->where('user_id', $user->id)
            ->whereDate('booking_date', '>=', today())
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->orderBy('booking_date')->orderBy('start_time')
            ->get()->map(fn($b) => $this->formatBooking($b));

        $stats = $isHR ? [
            'today_count'   => ResourceBooking::whereHas('resource', fn($q) => $q->where('country_id', $countryId))->whereDate('booking_date', today())->where('status', 'approved')->count(),
            'room_count' => ResourceBooking::whereHas('resource', fn($q) =>
                            $q->where('country_id', $countryId)->where('type', 'room')
                                )->whereDate('booking_date', today())
                                ->where('status', 'approved')
                                ->count(),

            'car_count' => ResourceBooking::whereHas('resource', fn($q) =>
                            $q->where('country_id', $countryId)->where('type', 'car')
                                )->whereDate('booking_date', today())
                                ->where('status', 'approved')
                                ->count(),
        ] : null;

        $users = $isHR
            ? User::select('id', 'name')->where('country_id', $countryId)->where('is_active', true)->orderBy('name')->get()
            : collect();

        return Inertia::render('Bookings/Index', [
            'resources'       => $resources,
            'pendingBookings' => $pendingBookings,
            'myBookings'      => $myBookings,
            'stats'           => $stats,
            'isHR'            => $isHR,
            'users'           => $users,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  AJAX — Calendar bookings for a date + type
    //  GET /bookings/calendar?type=room&date=2026-04-28
    // ═══════════════════════════════════════════════════════════════

    public function calendarBookings(Request $request)
    {
        $request->validate([
            'type' => 'required|in:room,car',
            'date' => 'required|date',
        ]);

        $countryId = Auth::user()->country_id;

        $bookings = ResourceBooking::with(['resource:id,name,type,location,capacity', 'user:id,name,avatar_url'])
            ->whereHas('resource', fn($q) => $q
                ->where('country_id', $countryId)
                ->where('type', $request->type)
                ->where('is_active', true)
            )
            ->whereDate('booking_date', $request->date)
            ->whereIn('status', ['approved', 'pending'])
            ->orderBy('start_time')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));

        return response()->json(['bookings' => $bookings]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  AJAX — Available resources filtered by date/time/capacity
    //  GET /bookings/available-resources?type=room&date=&start_time=&end_time=&capacity=
    // ═══════════════════════════════════════════════════════════════

    public function availableResources(Request $request)
    {
        $request->validate([
            'type'       => 'required|in:room,car',
            'date'       => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'nullable|date_format:H:i|after:start_time',
            'capacity'   => 'nullable|integer|min:1',
        ]);

        $countryId = Auth::user()->country_id;

        $query = BookableResource::with(['driver:id,name,avatar_url'])
            ->where('country_id', $countryId)
            ->where('type', $request->type)
            ->where('is_active', true)
            ->orderBy('name');

        // Room — capacity filter
        if ($request->type === 'room' && $request->capacity) {
            $query->where('capacity', '>=', (int)$request->capacity);
        }

        $resources = $query->get();

        $result = $resources->map(function ($r) use ($request) {
            $isAvailable  = true;
            $availableFrom = null;
            $isOpenEndedOut = false;

            // Car — open-ended active?
            if ($r->isCar()) {
                $requestedEnd = $request->end_time ?: '23:59';

                $openEndedConflict = ResourceBooking::where('resource_id', $r->id)
                    ->whereDate('booking_date', $request->date)
                    ->whereIn('status', ['approved', 'pending'])
                    ->whereNull('end_time')
                    ->where('start_time', '<', $requestedEnd)
                    ->exists();

                if ($openEndedConflict) {
                    $isAvailable = false;
                    $isOpenEndedOut = true;
                } elseif (!$request->end_time) {
                    $futureOrOverlapBooking = ResourceBooking::where('resource_id', $r->id)
                        ->whereDate('booking_date', $request->date)
                        ->whereIn('status', ['approved', 'pending'])
                        ->where(function ($q) use ($request) {
                            $q->whereNull('end_time')
                            ->orWhere('end_time', '>', $request->start_time);
                        })
                        ->exists();

                    if ($futureOrOverlapBooking) {
                        $isAvailable = false;
                    }
                } else {
                    $hasConflict = $r->hasConflict($request->date, $request->start_time, $request->end_time);

                    if ($hasConflict) {
                        $isAvailable = false;

                        $lastConflict = ResourceBooking::where('resource_id', $r->id)
                            ->whereDate('booking_date', $request->date)
                            ->whereIn('status', ['approved', 'pending'])
                            ->where('start_time', '<', $request->end_time)
                            ->where(function ($q) use ($request) {
                                $q->whereNull('end_time')
                                ->orWhere('end_time', '>', $request->start_time);
                            })
                            ->orderByRaw('COALESCE(end_time, "23:59") desc')
                            ->first();

                        $availableFrom = $lastConflict && $lastConflict->end_time
                            ? substr($lastConflict->end_time, 0, 5)
                            : null;
                    }
                }
            } elseif ($request->end_time) {
                $hasConflict = $r->hasConflict($request->date, $request->start_time, $request->end_time);
                if ($hasConflict) {
                    $isAvailable = false;
                    // ဘယ်အချိန်ကနေ ရနိုင်မလဲ ပြပေး
                    $lastConflict = ResourceBooking::where('resource_id', $r->id)
                        ->whereDate('booking_date', $request->date)
                        ->whereIn('status', ['approved', 'pending'])
                        ->where('start_time', '<', $request->end_time)
                        ->where('end_time', '>', $request->start_time)
                        ->orderBy('end_time', 'desc')
                        ->first();
                    $availableFrom = $lastConflict ? substr($lastConflict->end_time, 0, 5) : null;
                }
            }

            return [
                ...$this->formatResource($r),
                'is_available'      => $isAvailable,
                'available_from'    => $availableFrom,
                'is_open_ended_out' => $isOpenEndedOut,
            ];
        });

        return response()->json(['resources' => $result]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  HR/Admin — Resource CRUD
    // ═══════════════════════════════════════════════════════════════

    public function storeResource(Request $request)
    {
        $this->authorizeHR();
        $validated = $request->validate([
            'type'         => 'required|in:room,car',
            'name'         => 'required|string|max:255',
            'location'     => 'nullable|string|max:255',
            'capacity'     => 'nullable|integer|min:1',
            'rules'        => 'nullable|string',
            'plate_number' => 'required_if:type,car|nullable|string|max:20',
            'driver_id'    => 'required_if:type,car|nullable|exists:users,id',
        ]);
        $validated['country_id'] = Auth::user()->country_id;
        if ($validated['type'] === 'room') { $validated['driver_id'] = null; $validated['plate_number'] = null; }
        BookableResource::create($validated);
        return back()->with('success', 'Resource created successfully.');
    }

    public function updateResource(Request $request, BookableResource $resource)
    {
        $this->authorizeHR();
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'location'     => 'nullable|string|max:255',
            'capacity'     => 'nullable|integer|min:1',
            'rules'        => 'nullable|string',
            'plate_number' => 'nullable|string|max:20',
            'driver_id'    => 'nullable|exists:users,id',
            'is_active'    => 'boolean',
        ]);
        $resource->update($validated);
        return back()->with('success', 'Resource updated.');
    }

    public function destroyResource(BookableResource $resource)
    {
        $this->authorizeHR();
        $resource->delete();
        return back()->with('success', 'Resource deleted.');
    }

    // ═══════════════════════════════════════════════════════════════
    //  Booking CRUD
    // ═══════════════════════════════════════════════════════════════

    public function store(Request $request)
    {
        $validated = $request->validate([
            'resource_id'   => 'required|exists:bookable_resources,id',
            'booking_date'  => 'required|date|after_or_equal:today',
            'start_time'    => 'required|date_format:H:i',
            'end_time'      => 'nullable|date_format:H:i|after:start_time',
            'purpose'       => 'required|string|max:500',
            'is_open_ended' => 'boolean',
        ]);

        $user        = Auth::user();
        $resource    = BookableResource::findOrFail($validated['resource_id']);
        $isOpenEnded = $resource->isCar() && ($validated['is_open_ended'] ?? false);

        // Car — open-ended active booking exists → waitlist
        if ($resource->isCar()) {

            $requestedEnd = $validated['end_time'] ?? '23:59';

            $openEndedConflict = ResourceBooking::where('resource_id', $resource->id)
                ->whereDate('booking_date', $validated['booking_date'])
                ->whereIn('status', ['approved', 'pending'])
                ->whereNull('end_time')
                ->where('start_time', '<', $requestedEnd)
                ->exists();

            if ($openEndedConflict) {
                ResourceBooking::create([
                    ...$validated,
                    'user_id'       => $user->id,
                    'is_open_ended' => $isOpenEnded,
                    'status'        => 'waitlisted',
                ]);

                return back()->with('success', 'Added to waitlist. Car is occupied during requested time.');
            }
        }

        // Car with end_time — conflict check with existing bookings
        if ($resource->isCar() && !$isOpenEnded && !empty($validated['end_time'])) {
            if ($resource->hasConflict($validated['booking_date'], $validated['start_time'], $validated['end_time'])) {
                return back()->withErrors(['time' => 'This car is already booked during that time slot.']);
            }
        }

        // Room conflict check
        if ($resource->isRoom() && !empty($validated['end_time'])) {
            if ($resource->hasConflict($validated['booking_date'], $validated['start_time'], $validated['end_time'])) {
                return back()->withErrors(['time' => 'This room is already booked during that time slot.']);
            }
        }

        // Auto-approve — no HR approval needed, booking is immediately confirmed
        ResourceBooking::create([
            ...$validated,
            'user_id'       => $user->id,
            'is_open_ended' => $isOpenEnded,
            'status'        => 'approved',
            'approved_by'   => $user->id,
            'approved_at'   => now(),
        ]);

        return back()->with('success', 'Booking confirmed for ' . $resource->name . '.');
    }

    public function cancel(ResourceBooking $booking)
    {
        abort_unless($booking->user_id === Auth::id(), 403);
        abort_unless($booking->isPending() || $booking->isApproved(), 422);
        $booking->update(['status' => 'cancelled']);
        return back()->with('success', 'Booking cancelled.');
    }

    public function approve(ResourceBooking $booking)
    {
        $this->authorizeHR();
        abort_unless($booking->isPending(), 422);
        $booking->update(['status' => 'approved', 'approved_by' => Auth::id(), 'approved_at' => now()]);
        return back()->with('success', 'Booking approved.');
    }

    public function reject(Request $request, ResourceBooking $booking)
    {
        $this->authorizeHR();
        $request->validate(['reject_reason' => 'required|string|max:500']);
        abort_unless($booking->isPending(), 422);
        $booking->update(['status' => 'rejected', 'reject_reason' => $request->reject_reason, 'approved_by' => Auth::id(), 'approved_at' => now()]);
        return back()->with('success', 'Booking rejected.');
    }

    public function markReturned(ResourceBooking $booking)
    {
        $this->authorizeHR();
        abort_unless($booking->resource->isCar() && $booking->isApproved(), 422);
        $booking->update(['returned_at' => now(), 'status' => 'completed']);
        $next = $booking->resource->nextWaitlisted();
        if ($next) $next->update(['status' => 'pending']);
        return back()->with('success', 'Car marked as returned.' . ($next ? ' Next waitlisted booking is now pending.' : ''));
    }

    // ═══════════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════════

    private function formatResource(BookableResource $r): array
    {
        return [
            'id'                   => $r->id,
            'type'                 => $r->type,
            'name'                 => $r->name,
            'location'             => $r->location,
            'capacity'             => $r->capacity,
            'rules'                => $r->rules,
            'plate_number'         => $r->plate_number,
            'photo'                => $r->photo,
            'is_active'            => $r->is_active,
            'driver'               => $r->driver ? ['id' => $r->driver->id, 'name' => $r->driver->name, 'avatar_url' => $r->driver->avatar_url] : null,
            'is_open_ended_active' => $r->isCar() ? $r->hasOpenEndedBooking() : false,
        ];
    }

    private function formatBooking(ResourceBooking $b): array
    {
        return [
            'id'            => $b->id,
            'resource'      => $b->resource ? ['id' => $b->resource->id, 'name' => $b->resource->name, 'type' => $b->resource->type, 'location' => $b->resource->location, 'capacity' => $b->resource->capacity ?? null] : null,
            'user'          => $b->user ? ['id' => $b->user->id, 'name' => $b->user->name, 'avatar_url' => $b->user->avatar_url] : null,
            'booking_date'  => $b->booking_date->format('Y-m-d'),
            'start_time'    => substr($b->start_time, 0, 5),
            'end_time'      => $b->end_time ? substr($b->end_time, 0, 5) : null,
            'purpose'       => $b->purpose,
            'is_open_ended' => $b->is_open_ended,
            'status'        => $b->status,
            'reject_reason' => $b->reject_reason,
            'returned_at'   => $b->returned_at?->format('d M Y H:i'),
            'created_at'    => $b->created_at->format('d M Y H:i'),
        ];
    }

    private function authorizeHR(): void
    {
        abort_unless(Auth::user()->hasAnyRole(['hr', 'admin']), 403);
    }
}