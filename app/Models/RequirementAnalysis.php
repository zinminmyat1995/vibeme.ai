<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequirementAnalysis extends Model
{
    protected $fillable = [
        'client_id', 'created_by', 'project_title', 'project_description',
        'core_features', 'platform', 'expected_users', 'integration_needs',
        'budget_range', 'expected_deadline', 'special_requirements',
        'status', 'ai_analysis',
    ];

    protected $casts = [
        'core_features' => 'array',
        'ai_analysis'   => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}