<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\LeavePolicy;
use Illuminate\Database\Seeder;

class LeavePolicySeeder extends Seeder
{
    public function run(): void
    {
        $policies = [
            'Myanmar' => [
                ['leave_type' => 'annual', 'days_per_year' => 10, 'is_paid' => true, 'carry_over_days' => 5],
                ['leave_type' => 'medical', 'days_per_year' => 30, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'emergency', 'days_per_year' => 3, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'maternity', 'days_per_year' => 98, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'paternity', 'days_per_year' => 15, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'unpaid', 'days_per_year' => 30, 'is_paid' => false, 'carry_over_days' => 0],
            ],
            'Cambodia' => [
                ['leave_type' => 'annual', 'days_per_year' => 18, 'is_paid' => true, 'carry_over_days' => 5],
                ['leave_type' => 'medical', 'days_per_year' => 30, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'emergency', 'days_per_year' => 7, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'maternity', 'days_per_year' => 90, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'paternity', 'days_per_year' => 10, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'unpaid', 'days_per_year' => 30, 'is_paid' => false, 'carry_over_days' => 0],
            ],
            'Japan' => [
                ['leave_type' => 'annual', 'days_per_year' => 20, 'is_paid' => true, 'carry_over_days' => 20],
                ['leave_type' => 'medical', 'days_per_year' => 30, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'emergency', 'days_per_year' => 5, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'maternity', 'days_per_year' => 98, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'paternity', 'days_per_year' => 30, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'unpaid', 'days_per_year' => 30, 'is_paid' => false, 'carry_over_days' => 0],
            ],
            'Vietnam' => [
                ['leave_type' => 'annual', 'days_per_year' => 12, 'is_paid' => true, 'carry_over_days' => 5],
                ['leave_type' => 'medical', 'days_per_year' => 30, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'emergency', 'days_per_year' => 3, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'maternity', 'days_per_year' => 180, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'paternity', 'days_per_year' => 5, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'unpaid', 'days_per_year' => 30, 'is_paid' => false, 'carry_over_days' => 0],
            ],
            'Korea' => [
                ['leave_type' => 'annual', 'days_per_year' => 15, 'is_paid' => true, 'carry_over_days' => 10],
                ['leave_type' => 'medical', 'days_per_year' => 30, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'emergency', 'days_per_year' => 5, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'maternity', 'days_per_year' => 90, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'paternity', 'days_per_year' => 10, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'unpaid', 'days_per_year' => 30, 'is_paid' => false, 'carry_over_days' => 0],
            ],
            'United States' => [
                ['leave_type' => 'annual', 'days_per_year' => 15, 'is_paid' => true, 'carry_over_days' => 5],
                ['leave_type' => 'medical', 'days_per_year' => 10, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'emergency', 'days_per_year' => 3, 'is_paid' => true, 'carry_over_days' => 0],
                ['leave_type' => 'maternity', 'days_per_year' => 84, 'is_paid' => false, 'carry_over_days' => 0],
                ['leave_type' => 'paternity', 'days_per_year' => 84, 'is_paid' => false, 'carry_over_days' => 0],
                ['leave_type' => 'unpaid', 'days_per_year' => 30, 'is_paid' => false, 'carry_over_days' => 0],
            ],
        ];

        foreach ($policies as $countryName => $countryPolicies) {
            $country = Country::where('name', $countryName)->first();
            if (!$country) continue;

            foreach ($countryPolicies as $policy) {
                LeavePolicy::create([
                    'country_id' => $country->id,
                    'leave_type' => $policy['leave_type'],
                    'days_per_year' => $policy['days_per_year'],
                    'is_paid' => $policy['is_paid'],
                    'carry_over_days' => $policy['carry_over_days'],
                ]);
            }
        }
    }
}