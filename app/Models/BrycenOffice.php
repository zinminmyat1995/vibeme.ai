<?php
// ═══════════════════════════════════════════
// app/Models/BrycenOffice.php
// ═══════════════════════════════════════════
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BrycenOffice extends Model
{
    protected $fillable = [
        'country_key', 'country_name', 'company_name', 'city',
        'address', 'email', 'phone', 'website_url', 'map_embed_url',
        'image_path', 'about', 'founded', 'specialization', 'is_active',
    ];

    public function jobPostings()
    {
        return $this->hasMany(JobPosting::class);
    }

    public function openJobPostings()
    {
        return $this->hasMany(JobPosting::class)->where('status', 'open');
    }
}