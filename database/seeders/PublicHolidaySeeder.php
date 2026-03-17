<?php

namespace Database\Seeders;

use App\Models\PublicHoliday;
use App\Models\Country;
use Illuminate\Database\Seeder;

class PublicHolidaySeeder extends Seeder
{
    public function run(): void
    {
        $holidays = [
            // Myanmar
            'Myanmar' => [
                ['name' => 'Independence Day', 'date' => '2026-01-04', 'is_recurring' => true],
                ['name' => 'Union Day', 'date' => '2026-02-12', 'is_recurring' => true],
                ['name' => 'Peasants Day', 'date' => '2026-03-02', 'is_recurring' => true],
                ['name' => 'Resistance Day', 'date' => '2026-03-27', 'is_recurring' => true],
                ['name' => 'Thingyan Water Festival', 'date' => '2026-04-13', 'is_recurring' => true],
                ['name' => 'Thingyan Water Festival', 'date' => '2026-04-14', 'is_recurring' => true],
                ['name' => 'Thingyan Water Festival', 'date' => '2026-04-15', 'is_recurring' => true],
                ['name' => 'Myanmar New Year', 'date' => '2026-04-16', 'is_recurring' => true],
                ['name' => 'Workers Day', 'date' => '2026-05-01', 'is_recurring' => true],
                ['name' => 'Martyrs Day', 'date' => '2026-07-19', 'is_recurring' => true],
                ['name' => 'National Day', 'date' => '2026-11-18', 'is_recurring' => true],
                ['name' => 'Christmas Day', 'date' => '2026-12-25', 'is_recurring' => true],
            ],

            // Cambodia
            'Cambodia' => [
                ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'is_recurring' => true],
                ['name' => 'Victory Day', 'date' => '2026-01-07', 'is_recurring' => true],
                ['name' => 'Meak Bochea Day', 'date' => '2026-02-11', 'is_recurring' => true],
                ['name' => 'Women\'s Day', 'date' => '2026-03-08', 'is_recurring' => true],
                ['name' => 'Khmer New Year', 'date' => '2026-04-14', 'is_recurring' => true],
                ['name' => 'Khmer New Year', 'date' => '2026-04-15', 'is_recurring' => true],
                ['name' => 'Khmer New Year', 'date' => '2026-04-16', 'is_recurring' => true],
                ['name' => 'Visak Bochea Day', 'date' => '2026-05-11', 'is_recurring' => true],
                ['name' => 'Workers Day', 'date' => '2026-05-01', 'is_recurring' => true],
                ['name' => 'King\'s Birthday', 'date' => '2026-05-13', 'is_recurring' => true],
                ['name' => 'King\'s Birthday', 'date' => '2026-05-14', 'is_recurring' => true],
                ['name' => 'King\'s Birthday', 'date' => '2026-05-15', 'is_recurring' => true],
                ['name' => 'Queen Mother\'s Birthday', 'date' => '2026-06-18', 'is_recurring' => true],
                ['name' => 'Constitution Day', 'date' => '2026-09-24', 'is_recurring' => true],
                ['name' => 'Pchum Ben Day', 'date' => '2026-10-05', 'is_recurring' => true],
                ['name' => 'Pchum Ben Day', 'date' => '2026-10-06', 'is_recurring' => true],
                ['name' => 'Pchum Ben Day', 'date' => '2026-10-07', 'is_recurring' => true],
                ['name' => 'King Father\'s Commemoration', 'date' => '2026-10-15', 'is_recurring' => true],
                ['name' => 'Independence Day', 'date' => '2026-11-09', 'is_recurring' => true],
                ['name' => 'Water Festival', 'date' => '2026-11-19', 'is_recurring' => true],
                ['name' => 'Water Festival', 'date' => '2026-11-20', 'is_recurring' => true],
                ['name' => 'Water Festival', 'date' => '2026-11-21', 'is_recurring' => true],
                ['name' => 'Human Rights Day', 'date' => '2026-12-10', 'is_recurring' => true],
            ],

            // Japan
            'Japan' => [
                ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'is_recurring' => true],
                ['name' => 'Coming of Age Day', 'date' => '2026-01-12', 'is_recurring' => false],
                ['name' => 'National Foundation Day', 'date' => '2026-02-11', 'is_recurring' => true],
                ['name' => 'Emperor\'s Birthday', 'date' => '2026-02-23', 'is_recurring' => true],
                ['name' => 'Vernal Equinox Day', 'date' => '2026-03-20', 'is_recurring' => false],
                ['name' => 'Showa Day', 'date' => '2026-04-29', 'is_recurring' => true],
                ['name' => 'Constitution Day', 'date' => '2026-05-03', 'is_recurring' => true],
                ['name' => 'Greenery Day', 'date' => '2026-05-04', 'is_recurring' => true],
                ['name' => 'Children\'s Day', 'date' => '2026-05-05', 'is_recurring' => true],
                ['name' => 'Marine Day', 'date' => '2026-07-20', 'is_recurring' => false],
                ['name' => 'Mountain Day', 'date' => '2026-08-11', 'is_recurring' => true],
                ['name' => 'Respect for the Aged Day', 'date' => '2026-09-21', 'is_recurring' => false],
                ['name' => 'Autumnal Equinox Day', 'date' => '2026-09-23', 'is_recurring' => false],
                ['name' => 'Sports Day', 'date' => '2026-10-12', 'is_recurring' => false],
                ['name' => 'Culture Day', 'date' => '2026-11-03', 'is_recurring' => true],
                ['name' => 'Labour Thanksgiving Day', 'date' => '2026-11-23', 'is_recurring' => true],
            ],

            // Vietnam
            'Vietnam' => [
                ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'is_recurring' => true],
                ['name' => 'Tet Holiday', 'date' => '2026-02-16', 'is_recurring' => false],
                ['name' => 'Tet Holiday', 'date' => '2026-02-17', 'is_recurring' => false],
                ['name' => 'Tet Holiday', 'date' => '2026-02-18', 'is_recurring' => false],
                ['name' => 'Tet Holiday', 'date' => '2026-02-19', 'is_recurring' => false],
                ['name' => 'Tet Holiday', 'date' => '2026-02-20', 'is_recurring' => false],
                ['name' => 'Hung Kings Commemoration', 'date' => '2026-04-02', 'is_recurring' => false],
                ['name' => 'Reunification Day', 'date' => '2026-04-30', 'is_recurring' => true],
                ['name' => 'Workers Day', 'date' => '2026-05-01', 'is_recurring' => true],
                ['name' => 'National Day', 'date' => '2026-09-02', 'is_recurring' => true],
                ['name' => 'National Day', 'date' => '2026-09-03', 'is_recurring' => true],
            ],

            // Korea
            'Korea' => [
                ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'is_recurring' => true],
                ['name' => 'Lunar New Year', 'date' => '2026-02-16', 'is_recurring' => false],
                ['name' => 'Lunar New Year', 'date' => '2026-02-17', 'is_recurring' => false],
                ['name' => 'Lunar New Year', 'date' => '2026-02-18', 'is_recurring' => false],
                ['name' => 'Independence Movement Day', 'date' => '2026-03-01', 'is_recurring' => true],
                ['name' => 'Children\'s Day', 'date' => '2026-05-05', 'is_recurring' => true],
                ['name' => 'Buddha\'s Birthday', 'date' => '2026-05-24', 'is_recurring' => false],
                ['name' => 'Memorial Day', 'date' => '2026-06-06', 'is_recurring' => true],
                ['name' => 'Liberation Day', 'date' => '2026-08-15', 'is_recurring' => true],
                ['name' => 'Chuseok', 'date' => '2026-09-24', 'is_recurring' => false],
                ['name' => 'Chuseok', 'date' => '2026-09-25', 'is_recurring' => false],
                ['name' => 'Chuseok', 'date' => '2026-09-26', 'is_recurring' => false],
                ['name' => 'National Foundation Day', 'date' => '2026-10-03', 'is_recurring' => true],
                ['name' => 'Hangul Day', 'date' => '2026-10-09', 'is_recurring' => true],
                ['name' => 'Christmas Day', 'date' => '2026-12-25', 'is_recurring' => true],
            ],

            // United States
            'United States' => [
                ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'is_recurring' => true],
                ['name' => 'Martin Luther King Jr. Day', 'date' => '2026-01-19', 'is_recurring' => false],
                ['name' => 'Presidents\' Day', 'date' => '2026-02-16', 'is_recurring' => false],
                ['name' => 'Memorial Day', 'date' => '2026-05-25', 'is_recurring' => false],
                ['name' => 'Juneteenth', 'date' => '2026-06-19', 'is_recurring' => true],
                ['name' => 'Independence Day', 'date' => '2026-07-04', 'is_recurring' => true],
                ['name' => 'Labor Day', 'date' => '2026-09-07', 'is_recurring' => false],
                ['name' => 'Columbus Day', 'date' => '2026-10-12', 'is_recurring' => false],
                ['name' => 'Veterans Day', 'date' => '2026-11-11', 'is_recurring' => true],
                ['name' => 'Thanksgiving Day', 'date' => '2026-11-26', 'is_recurring' => false],
                ['name' => 'Christmas Day', 'date' => '2026-12-25', 'is_recurring' => true],
            ],
        ];

        foreach ($holidays as $countryName => $countryHolidays) {
            $country = Country::where('name', $countryName)->first();
            if (!$country) continue;

            foreach ($countryHolidays as $holiday) {
                PublicHoliday::create([
                    'country_id' => $country->id,
                    'name' => $holiday['name'],
                    'date' => $holiday['date'],
                    'is_recurring' => $holiday['is_recurring'],
                ]);
            }
        }
    }
}