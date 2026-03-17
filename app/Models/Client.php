<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'company_name', 'contact_person', 'email',
        'phone', 'industry', 'country', 'notes',
    ];

    public function requirementAnalyses()
    {
        return $this->hasMany(RequirementAnalysis::class);
    }
}