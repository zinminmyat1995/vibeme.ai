<?php

namespace App\Console\Commands;

use App\Models\BookingAttendee;
use App\Models\Notification;
use App\Models\ResourceBooking;
use App\Models\Country;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class BookingReminder extends Command
{
    protected $signature   = 'bookings:remind';
    protected $description = 'Send 10-minute reminder notifications for upcoming bookings';

    // Country → Timezone (DashboardController နဲ့တူညီ)
    private function timezone(int $countryId): string
    {
        $country = Country::find($countryId);
        return match (strtolower($country?->name ?? '')) {
            'cambodia'             => 'Asia/Phnom_Penh',
            'myanmar'              => 'Asia/Rangoon',
            'vietnam'              => 'Asia/Ho_Chi_Minh',
            'japan'                => 'Asia/Tokyo',
            'korea', 'south korea' => 'Asia/Seoul',
            default                => 'UTC',
        };
    }

    public function handle(): int
    {
        // Country တစ်ခုချင်းစီ သီးခြား check
        $countries = Country::all();

        $total = 0;

        foreach ($countries as $country) {
            $tz  = $this->timezone($country->id);
            $now = Carbon::now($tz);

            $windowStart = $now->copy()->addMinutes(9)->format('H:i');
            $windowEnd   = $now->copy()->addMinutes(11)->format('H:i');
            $today       = $now->toDateString();

            $bookings = ResourceBooking::with([
                    'resource:id,name,type,country_id',
                    'user:id,name',
                    'attendees.user:id,name',
                ])
                ->where('status', 'approved')
                ->whereDate('booking_date', $today)
                ->whereTime('start_time', '>=', $windowStart)
                ->whereTime('start_time', '<=', $windowEnd)
                ->whereHas('resource', fn($q) => $q->where('country_id', $country->id))
                ->get();

            foreach ($bookings as $booking) {
                $resourceName = $booking->resource->name;
                $type         = $booking->resource->type === 'car' ? '🚗' : '🏢';
                $startTime    = substr($booking->start_time, 0, 5);
                $title        = '⏰ Booking Reminder';
                $body         = "{$type} {$resourceName} booking starts at {$startTime}. (10 minutes left)";
                $url          = '/bookings';

                // Organizer notify
                Notification::send(
                    userId: $booking->user_id,
                    type:   'booking_reminder',
                    title:  $title,
                    body:   $body,
                    url:    $url,
                );

                // Attendees notify
                foreach ($booking->attendees as $attendee) {
                    if ($attendee->user_id === $booking->user_id) continue;
                    Notification::send(
                        userId: $attendee->user_id,
                        type:   'booking_reminder',
                        title:  $title,
                        body:   $body,
                        url:    $url,
                    );
                }

                $this->info("Reminded [{$country->name}]: Booking #{$booking->id} — {$resourceName} at {$startTime}");
                $total++;
            }
        }

        $this->info("✅ Booking reminders done. Total: {$total}");
        return self::SUCCESS;
    }
}