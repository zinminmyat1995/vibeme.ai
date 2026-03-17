<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
public function run(): void
{
    $countries = [
        [
            'name'                  => 'Myanmar',
            'currency_code'         => 'MMK',
            'work_hours_per_day'    => 8,
            'lunch_break_minutes'   => 60,
            'standard_start_time'   => '09:00',
            'work_days_per_week'    => 5,
            'overtime_rate_weekday' => 1.5,
            'overtime_rate_weekend' => 2.0,
            'overtime_rate_holiday' => 2.0,
            'is_active'             => true,
        ],
        [
            'name'                  => 'Cambodia',
            'currency_code'         => 'KHR',
            'work_hours_per_day'    => 8,
            'lunch_break_minutes'   => 90,
            'standard_start_time'   => '08:00',
            'work_days_per_week'    => 5,
            'overtime_rate_weekday' => 1.5,
            'overtime_rate_weekend' => 2.0,
            'overtime_rate_holiday' => 2.0,
            'is_active'             => true,
        ],
        [
            'name'                  => 'Japan',
            'currency_code'         => 'JPY',
            'work_hours_per_day'    => 8,
            'lunch_break_minutes'   => 60,
            'standard_start_time'   => '09:00',
            'work_days_per_week'    => 5,
            'overtime_rate_weekday' => 1.25,
            'overtime_rate_weekend' => 1.35,
            'overtime_rate_holiday' => 1.35,
            'is_active'             => true,
        ],
        [
            'name'                  => 'Vietnam',
            'currency_code'         => 'VND',
            'work_hours_per_day'    => 8,
            'lunch_break_minutes'   => 60,
            'standard_start_time'   => '08:00',
            'work_days_per_week'    => 5,
            'overtime_rate_weekday' => 1.5,
            'overtime_rate_weekend' => 2.0,
            'overtime_rate_holiday' => 3.0,
            'is_active'             => true,
        ],
        [
            'name'                  => 'Korea',
            'currency_code'         => 'KRW',
            'work_hours_per_day'    => 8,
            'lunch_break_minutes'   => 60,
            'standard_start_time'   => '09:00',
            'work_days_per_week'    => 5,
            'overtime_rate_weekday' => 1.5,
            'overtime_rate_weekend' => 1.5,
            'overtime_rate_holiday' => 2.0,
            'is_active'             => true,
        ],
        [
            'name'                  => 'United States',
            'currency_code'         => 'USD',
            'work_hours_per_day'    => 8,
            'lunch_break_minutes'   => 30,
            'standard_start_time'   => '09:00',
            'work_days_per_week'    => 5,
            'overtime_rate_weekday' => 1.5,
            'overtime_rate_weekend' => 1.5,
            'overtime_rate_holiday' => 2.0,
            'is_active'             => true,
        ],
    ];

    foreach ($countries as $country) {
        Country::updateOrCreate(
            ['name' => $country['name']],  // ← existing record update လုပ်မယ်
            $country
        );
    }
}
}