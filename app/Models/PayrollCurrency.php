<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollCurrency extends Model
{
    protected $fillable = [
        'country_id',
        'currency_name',
        'currency_code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }
}