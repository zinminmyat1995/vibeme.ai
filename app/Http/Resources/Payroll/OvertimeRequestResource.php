<?php

namespace App\Http\Resources\Payroll;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OvertimeRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date->toDateString(),
            'hours_requested' => $this->hours_requested,
            'hours_approved' => $this->hours_approved,
            'reason' => $this->reason,
            'status' => $this->status,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'approved_by' => $this->whenLoaded('approvedBy', fn() =>
                $this->approvedBy ? [
                    'id' => $this->approvedBy->id,
                    'name' => $this->approvedBy->name,
                ] : null
            ),
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}