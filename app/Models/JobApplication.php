<?php


// ═══════════════════════════════════════════
// app/Models/JobApplication.php
// ═══════════════════════════════════════════
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    protected $fillable = [
        'job_posting_id', 'name', 'email', 'phone',
        'cv_path', 'cover_letter', 'status', 'reference_code', 'hr_note',
    ];

    public function jobPosting()
    {
        return $this->belongsTo(JobPosting::class);
    }

    // hasOne relation ထည့်
    public function interview()
    {
        return $this->hasOne(JobInterview::class, 'job_application_id');
    }
}