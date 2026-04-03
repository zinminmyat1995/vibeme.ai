<?php
// ═══════════════════════════════════════════
// app/Models/JobPosting.php
// ═══════════════════════════════════════════
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobPosting extends Model
{
    protected $fillable = [
        'brycen_office_id', 'title', 'department', 'type',
        'slots', 'description', 'requirements', 'responsibilities',
        'salary_range', 'status', 'deadline',
    ];

    protected $casts = [
        'deadline' => 'date',
    ];

    public function office()
    {
        return $this->belongsTo(BrycenOffice::class, 'brycen_office_id');
    }

    public function applications()
    {
        return $this->hasMany(JobApplication::class);
    }
}
