<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryAllowance extends Model
{
    protected $fillable = [
        'salary_rule_id',
        'name',
        'amount',
        'is_percentage',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_percentage' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function salaryRule(): BelongsTo
    {
        return $this->belongsTo(SalaryRule::class);
    }
}