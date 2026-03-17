<?php

namespace App\Http\Resources\Payroll;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CountryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'currency_code' => $this->currency_code,
            'work_hours_per_day' => $this->work_hours_per_day,
            'work_days_per_week' => $this->work_days_per_week,
            'overtime_rates' => [
                'weekday' => $this->overtime_rate_weekday,
                'weekend' => $this->overtime_rate_weekend,
                'holiday' => $this->overtime_rate_holiday,
            ],
            'is_active' => $this->is_active,
            'public_holidays' => $this->whenLoaded('publicHolidays', fn() =>
                $this->publicHolidays->map(fn($h) => [
                    'id' => $h->id,
                    'name' => $h->name,
                    'date' => $h->date->toDateString(),
                    'is_recurring' => $h->is_recurring,
                ])
            ),
            'salary_rules' => $this->whenLoaded('salaryRules', fn() =>
                $this->salaryRules->map(fn($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'is_active' => $r->is_active,
                ])
            ),
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}