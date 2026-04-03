<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobInterview extends Model
{
    protected $fillable = [
        'job_application_id',
        'scheduled_at',
        'type',
        'platform',
        'meeting_link',
        'location',
        'interviewer_name',
        'note_to_candidate',
        'score',
        'strengths',
        'weaknesses',
        'recommendation',
        'internal_note',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'score'        => 'integer',
    ];

    public function application()
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}