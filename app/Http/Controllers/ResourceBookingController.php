<?php

namespace App\Http\Controllers;

use App\Models\BookableResource;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\BookingAttendee;
use App\Models\Notification;

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

        // Calendar + Booking modal — active only
        $resources = BookableResource::with(['driver:id,name,avatar_url'])
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->orderBy('type')->orderBy('name')
            ->get()->map(fn($r) => $this->formatResource($r));

        // Manage tab — active + inactive အကုန်
        $allResources = BookableResource::with(['driver:id,name,avatar_url'])
            ->where('country_id', $countryId)
            ->orderBy('type')->orderBy('name')
            ->get()->map(fn($r) => $this->formatResource($r));

        $pendingQuery = ResourceBooking::with(['resource:id,name,type,location,capacity', 'user:id,name,avatar_url'])
            ->whereHas('resource', fn($q) => $q->where('country_id', $countryId))
            ->where('status', 'pending')
            ->orderBy('booking_date')->orderBy('start_time');

        if (!$isHR) $pendingQuery->where('user_id', $user->id);
        $pendingBookings = $pendingQuery->get()->map(fn($b) => $this->formatBooking($b));

        $myBookings = ResourceBooking::with(['resource:id,name,type,location','stops'])
            ->where('user_id', $user->id)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->orderBy('booking_date')->orderBy('start_time')
            ->get()->map(fn($b) => $this->formatBooking($b));

        $myInvitations = ResourceBooking::with(['resource:id,name,type,location', 'user:id,name,avatar_url'])
            ->whereHas('attendees', fn($q) => $q->where('user_id', $user->id))
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
            'allResources'    => $allResources,
            'pendingBookings' => $pendingBookings,
            'myBookings'      => $myBookings,
            'myInvitations'   => $myInvitations,
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
            ->whereIn('status', ['approved', 'pending', 'completed']) 
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
            'resource_id'          => 'required|exists:bookable_resources,id',
            'booking_date'         => 'required|date|after_or_equal:today',
            'start_time'           => 'required|date_format:H:i',
            'end_time'             => 'nullable|date_format:H:i|after:start_time',
            'purpose'              => 'required|string|max:500',
            'is_open_ended'        => 'boolean',
            'attendee_ids'         => 'nullable|array',
            'attendee_ids.*'       => 'exists:users,id',
            // ── Car trip fields ──
            'trip_type'            => 'nullable|string|in:one_way,multi_stop,pickup',
            'pickup_location'      => 'nullable|string|max:500',
            'has_return'           => 'nullable|boolean',
            'return_time'          => 'nullable|date_format:H:i',
            'stops'                => 'nullable|array',
            'stops.*.location'     => 'required_with:stops|string|max:500',
            'stops.*.arrival_time' => 'nullable|date_format:H:i',
        ]);

        $user        = Auth::user();
        $resource    = BookableResource::findOrFail($validated['resource_id']);
        $isOpenEnded = $resource->isCar() && ($validated['is_open_ended'] ?? false);

        if (!$resource->is_active) {
            return back()->withErrors([
                'resource_id' => 'This resource is no longer available. It may have been deactivated.'
            ]);
        }

        $attendeeIds = collect($validated['attendee_ids'] ?? [])
                        ->filter(fn($id) => $id != $user->id)
                        ->unique()
                        ->values();

        // Car — open-ended active booking ရှိနေရင် waitlist ထည့်
        if ($resource->isCar()) {
            $requestedEnd      = $validated['end_time'] ?? '23:59';
            $openEndedConflict = ResourceBooking::where('resource_id', $resource->id)
                ->whereDate('booking_date', $validated['booking_date'])
                ->whereIn('status', ['approved', 'pending'])
                ->whereNull('end_time')
                ->where('start_time', '<', $requestedEnd)
                ->exists();

            if ($openEndedConflict) {
                $booking = ResourceBooking::create([
                    'resource_id'     => $validated['resource_id'],
                    'booking_date'    => $validated['booking_date'],
                    'start_time'      => $validated['start_time'],
                    'end_time'        => $validated['end_time'] ?? null,
                    'purpose'         => $validated['purpose'],
                    'user_id'         => $user->id,
                    'is_open_ended'   => $isOpenEnded,
                    'status'          => 'waitlisted',
                    'trip_type'       => $validated['trip_type'] ?? null,
                    'pickup_location' => $validated['pickup_location'] ?? null,
                    'has_return'      => $validated['has_return'] ?? false,
                    'return_time'     => $validated['return_time'] ?? null,
                ]);
                $this->saveStops($booking, $validated['stops'] ?? []);
                $this->saveAttendees($booking, $attendeeIds->toArray());
                return back()->with('success', 'Added to waitlist. Car is occupied during requested time.');
            }
        }

        // Car — time conflict check
        if ($resource->isCar() && !$isOpenEnded && !empty($validated['end_time'])) {
            if ($resource->hasConflict($validated['booking_date'], $validated['start_time'], $validated['end_time'])) {
                return back()->withErrors(['time' => 'This car is already booked during that time slot.']);
            }
        }

        // Room — conflict check
        if ($resource->isRoom() && !empty($validated['end_time'])) {
            if ($resource->hasConflict($validated['booking_date'], $validated['start_time'], $validated['end_time'])) {
                return back()->withErrors(['time' => 'This room is already booked during that time slot.']);
            }
        }

        // Booking create
        $booking = ResourceBooking::create([
            'resource_id'     => $validated['resource_id'],
            'booking_date'    => $validated['booking_date'],
            'start_time'      => $validated['start_time'],
            'end_time'        => $validated['end_time'] ?? null,
            'purpose'         => $validated['purpose'],
            'user_id'         => $user->id,
            'is_open_ended'   => $isOpenEnded,
            'status'          => 'approved',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
            // Car trip fields
            'trip_type'       => $resource->isCar() ? ($validated['trip_type'] ?? null) : null,
            'pickup_location' => $resource->isCar() ? ($validated['pickup_location'] ?? null) : null,
            'has_return'      => $resource->isCar() ? ($validated['has_return'] ?? false) : false,
            'return_time'     => $resource->isCar() ? ($validated['return_time'] ?? null) : null,
        ]);

        // Stops save
        $this->saveStops($booking, $validated['stops'] ?? []);

        // Attendees save + notify
        $this->saveAttendees($booking, $attendeeIds->toArray());
        $this->notifyAttendees($booking, $user->name, $attendeeIds->toArray());
        $this->notifyDriver($booking, 'new');
        return back()->with('success', 'Booking confirmed for ' . $resource->name . '.');
    }

    public function cancel(ResourceBooking $booking)
    {
        abort_unless($booking->user_id === Auth::id(), 403);
        abort_unless($booking->isPending() || $booking->isApproved(), 422);

        // attendees load ဦး
        $booking->load(['attendees', 'resource:id,name,type']);

        $booking->update(['status' => 'cancelled']);

        // Attendees တွေကို notify
        $type      = $booking->resource->type === 'car' ? '🚗' : '🏢';
        $name      = $booking->resource->name;
        $date      = $booking->booking_date->format('d M Y');
        $startTime = substr($booking->start_time, 0, 5);
        $organizer = Auth::user()->name;

        foreach ($booking->attendees as $attendee) {
            if ($attendee->user_id === Auth::id()) continue;
            Notification::send(
                userId: $attendee->user_id,
                type:   'booking_cancelled',
                title:  '❌ Booking Cancelled',
                body:   "{$organizer} cancelled the {$type} {$name} booking on {$date} at {$startTime}.",
                url:    '/bookings',
                data:   ['booking_id' => $booking->id],
            );
        }
        $this->notifyDriver($booking, 'new');

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
            'trip_type'       => $b->trip_type,
            'pickup_location' => $b->pickup_location,
            'driver_status'   => $b->driver_status,
            'driver_note'     => $b->driver_note,
            'stops'           => $b->stops->map(fn($s) => [
                'order'        => $s->order,
                'location'     => $s->location,
                'arrival_time' => $s->arrival_time ? substr($s->arrival_time, 0, 5) : null,
            ])->values(),
        ];
    }

    // ── Attendees save ────────────────────────────────────────────────
    private function saveAttendees(ResourceBooking $booking, array $attendeeIds): void
    {
        if (empty($attendeeIds)) return;

        $rows = array_map(fn($uid) => [
            'booking_id' => $booking->id,
            'user_id'    => $uid,
            'created_at' => now(),
            'updated_at' => now(),
        ], $attendeeIds);

        BookingAttendee::upsert($rows, ['booking_id', 'user_id']);
    }

    private function saveStops(ResourceBooking $booking, array $stops): void
    {
        if (empty($stops)) return;

        foreach ($stops as $i => $stop) {
            if (!empty($stop['location'])) {
                $booking->stops()->create([
                    'order'        => $i + 1,
                    'location'     => $stop['location'],
                    'arrival_time' => $stop['arrival_time'] ?? null,
                ]);
            }
        }
    }

    // ── Notify attendees ──────────────────────────────────────────────
    private function notifyAttendees(ResourceBooking $booking, string $organizerName, array $attendeeIds): void
    {
        if (empty($attendeeIds)) return;

        $type      = $booking->resource->type === 'car' ? '🚗' : '🏢';
        $name      = $booking->resource->name;
        $date      = $booking->booking_date->format('d M Y');
        $startTime = substr($booking->start_time, 0, 5);
        $endTime   = $booking->end_time ? substr($booking->end_time, 0, 5) : 'Open ended';

        foreach ($attendeeIds as $userId) {
            Notification::send(
                userId: $userId,
                type:   'booking_invited',
                title:  '📅 Booking Invitation',
                body:   "{$organizerName} included you in a {$type} {$name} booking on {$date} ({$startTime}–{$endTime}).",
                url:    '/bookings',
                data:   ['booking_id' => $booking->id],
            );
        }
    }

    // ── User search (country-scoped) ──────────────────────────────────
    public function searchUsers(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        $users = User::where('country_id', Auth::user()->country_id)
            ->where('is_active', true)
            ->where('id', '!=', Auth::id())
            ->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                ->orWhere('email', 'like', '%' . $request->q . '%');
            })
            ->select('id', 'name', 'avatar_url', 'email')
            ->orderBy('name')
            ->limit(10)
            ->get();

        return response()->json(['users' => $users]);
    }

    // ── Conflict check for attendee ───────────────────────────────
    public function checkConflict(Request $request)
    {
        $request->validate([
            'user_id'    => 'required|exists:users,id',
            'date'       => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'nullable|date_format:H:i',
        ]);

        $userId    = $request->user_id;
        $date      = $request->date;
        $startTime = $request->start_time;
        $endTime   = $request->end_time ?? '23:59';

        // Bookings ကိုယ်တိုင် organizer ဖြစ်တာ
        $asOrganizer = ResourceBooking::with('resource:id,name,type')
            ->where('user_id', $userId)
            ->whereDate('booking_date', $date)
            ->whereIn('status', ['approved', 'pending'])
            ->where('start_time', '<', $endTime)
            ->where(function ($q) use ($startTime) {
                $q->whereNull('end_time')
                ->orWhere('end_time', '>', $startTime);
            })
            ->get()
            ->map(fn($b) => [
                'type'          => $b->resource?->type,
                'resource_name' => $b->resource?->name,
                'start_time'    => substr($b->start_time, 0, 5),
                'end_time'      => $b->end_time ? substr($b->end_time, 0, 5) : null,
                'role'          => 'organizer',
            ])
            ->toArray();  // ← plain array ပြောင်း

        // Bookings တခြားသူ invite လုပ်ထားတာ
        $asAttendee = ResourceBooking::with('resource:id,name,type')
            ->whereHas('attendees', fn($q) => $q->where('user_id', $userId))
            ->whereDate('booking_date', $date)
            ->whereIn('status', ['approved', 'pending'])
            ->where('start_time', '<', $endTime)
            ->where(function ($q) use ($startTime) {
                $q->whereNull('end_time')
                ->orWhere('end_time', '>', $startTime);
            })
            ->get()
            ->map(fn($b) => [
                'type'          => $b->resource?->type,
                'resource_name' => $b->resource?->name,
                'start_time'    => substr($b->start_time, 0, 5),
                'end_time'      => $b->end_time ? substr($b->end_time, 0, 5) : null,
                'role'          => 'attendee',
            ])
            ->toArray();  // ← plain array ပြောင်း

        // plain array နှစ်ခု merge လုပ်
        $conflicts = array_values(array_merge($asOrganizer, $asAttendee));

        return response()->json([
            'has_conflict' => count($conflicts) > 0,
            'conflicts'    => $conflicts,
        ]);
    }

    // ── Booking detail (for click modal) ─────────────────────────────
    public function detail(ResourceBooking $booking)
    {
        abort_unless(
            $booking->resource->country_id === Auth::user()->country_id,
            403
        );

        $booking->load([
            'resource:id,name,type,location,capacity,plate_number',
            'user:id,name,avatar_url',
            'attendees.user:id,name,avatar_url',
            'stops',
        ]);

        return response()->json([
            'booking' => [
                'id'              => $booking->id,
                'date'            => $booking->booking_date->format('d M Y'),
                'booking_date'    => $booking->booking_date->format('Y-m-d'),
                'start_time'      => substr($booking->start_time, 0, 5),
                'end_time'        => $booking->end_time ? substr($booking->end_time, 0, 5) : null,
                'is_open_ended'   => $booking->is_open_ended,
                'purpose'         => $booking->purpose,
                'status'          => $booking->status,
                'reject_reason'   => $booking->reject_reason,
                'trip_type'       => $booking->trip_type,
                'pickup_location' => $booking->pickup_location,
                'has_return'      => $booking->has_return,
                'return_time'     => $booking->return_time ? substr($booking->return_time, 0, 5) : null,
                'stops'           => $booking->stops->map(fn($s) => [
                    'order'    => $s->order,
                    'location' => $s->location,
                ])->values(),
                'resource'        => $booking->resource,
                'organizer'       => $booking->user,
                'attendees'       => $booking->attendees->map(fn($a) => $a->user)->filter()->values(),
            ],
        ]);
    }

    private function authorizeHR(): void
    {
        abort_unless(Auth::user()->hasAnyRole(['hr', 'admin']), 403);
    }

    // ── Notify driver (car bookings only) ──────────────────────────────
    private function notifyDriver(ResourceBooking $booking, string $event, string $organizerName = ''): void
    {
        // Car booking မဟုတ်ရင် skip
        if (!$booking->resource || $booking->resource->type !== 'car') return;

        // Driver assign မထားရင် skip
        $driverId = $booking->resource->driver_id ?? null;
        if (!$driverId) return;

        // Organizer ကိုယ်တိုင် driver ဖြစ်ခဲ့ရင် skip (မဖြစ်နိုင်သော်လည်း safety check)
        if ($driverId === $booking->user_id) return;

        $carName   = $booking->resource->name;
        $date      = $booking->booking_date->format('d M Y');
        $startTime = substr($booking->start_time, 0, 5);
        $endTime   = $booking->end_time ? substr($booking->end_time, 0, 5) : 'open-ended';
        $organizer = $organizerName ?: $booking->user?->name ?? 'Someone';

        if ($event === 'new') {
            Notification::send(
                userId: $driverId,
                type:   'driver_new_booking',
                title:  '🚗 New Trip Assigned',
                body:   "{$organizer} booked {$carName} on {$date} at {$startTime}–{$endTime}.",
                url:    '/driver/schedule',
                data:   ['booking_id' => $booking->id],
            );
        }

        if ($event === 'cancelled') {
            Notification::send(
                userId: $driverId,
                type:   'driver_booking_cancelled',
                title:  '❌ Trip Cancelled',
                body:   "{$organizer} cancelled the {$carName} booking on {$date} at {$startTime}.",
                url:    '/driver/schedule',
                data:   ['booking_id' => $booking->id],
            );
        }
    }
}