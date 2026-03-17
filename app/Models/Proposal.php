<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    protected $fillable = [
        'requirement_analysis_id', 'created_by', 'proposal_number',
        'language', 'status', 'content', 'sent_at',
    ];

    protected $casts = [
        'content'  => 'array',
        'sent_at'  => 'datetime',
    ];

    public function requirementAnalysis()
    {
        return $this->belongsTo(RequirementAnalysis::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}