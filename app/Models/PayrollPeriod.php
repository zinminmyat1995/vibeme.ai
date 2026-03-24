<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollPeriod extends Model
{
    protected $fillable = [
        'country_id',
        'day',           // period end day (e.g. 12, 24, 31) — month/year မသိမ်းဘဲ template
        'period_number', // monthly=1, semi=1or2, ten_day=1,2,or3
        'status',
        'generated_by',
    ];

    protected $casts = [
        'day'           => 'integer',
        'period_number' => 'integer',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function payrollRecords(): HasMany
    {
        return $this->hasMany(PayrollRecord::class);
    }
}