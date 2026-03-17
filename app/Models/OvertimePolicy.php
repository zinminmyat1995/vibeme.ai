<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OvertimePolicy extends Model
{
    protected $fillable = [
        'country_id',
        'title',
        'rate_type',
        'rate_value',
        'is_active',
    ];

    protected $casts = [
        'rate_value' => 'decimal:2',
        'is_active'  => 'boolean',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }
}