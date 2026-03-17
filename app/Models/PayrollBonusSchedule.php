<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollBonusSchedule extends Model
{
    protected $fillable = [
        'country_id',
        'bonus_type_id',
        'frequency',
        'pay_month',
        'pay_quarter',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function bonusType()
    {
        return $this->belongsTo(PayrollBonusType::class, 'bonus_type_id');
    }
}