<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialSecurityRule extends Model
{
    protected $fillable = [
        'salary_rule_id',
        'employee_rate_percentage',
        'employer_rate_percentage',
        'is_active',
    ];

    protected $casts = [
        'employee_rate_percentage' => 'decimal:2',
        'employer_rate_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function salaryRule(): BelongsTo
    {
        return $this->belongsTo(SalaryRule::class);
    }
}