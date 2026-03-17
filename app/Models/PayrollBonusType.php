<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollBonusType extends Model
{
    protected $fillable = [
        'country_id',
        'name',
        'calculation_type',
        'value',
        'is_active',
    ];

    protected $casts = [
        'value'     => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function schedules()
    {
        return $this->hasMany(PayrollBonusSchedule::class, 'bonus_type_id');
    }
}