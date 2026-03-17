<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryDeduction extends Model
{
    protected $fillable = [
        'country_id',
        'name',
        'deduction_type',
        'amount_per_unit',
        'unit_type',
        'applies_to',
        'is_active',
    ];

    protected $casts = [
        'amount_per_unit' => 'decimal:2',
        'is_active'       => 'boolean',
    ];

    public function salaryRule(): BelongsTo
    {
        return $this->belongsTo(SalaryRule::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}