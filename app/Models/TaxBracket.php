<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxBracket extends Model
{
    protected $fillable = [
        'salary_rule_id',
        'min_amount',
        'max_amount',
        'tax_percentage',
    ];

    protected $casts = [
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
    ];

    public function salaryRule(): BelongsTo
    {
        return $this->belongsTo(SalaryRule::class);
    }
}