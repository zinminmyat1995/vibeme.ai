<?php

namespace App\Http\Resources\Payroll;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PayrollRecordCollection extends ResourceCollection
{
    public $collects = PayrollRecordResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'summary' => [
                'total_employees' => $this->collection->count(),
                'total_gross' => $this->collection->sum(fn($r) =>
                    $r->base_salary
                    + $r->total_allowances
                    + $r->overtime_amount
                    + $r->bonus_amount
                ),
                'total_deductions' => $this->collection->sum(fn($r) =>
                    $r->total_deductions
                    + $r->tax_amount
                    + $r->social_security_amount
                ),
                'total_net_salary' => $this->collection->sum('net_salary'),
            ],
        ];
    }
}