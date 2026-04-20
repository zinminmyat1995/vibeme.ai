<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollBank extends Model
{
    protected $fillable = [
        'country_id',
        'bank_name',
        'bank_code',
        'email',
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