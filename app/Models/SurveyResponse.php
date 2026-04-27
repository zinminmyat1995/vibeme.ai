<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SurveyResponse extends Model
{
    protected $fillable = [
        'survey_id', 'respondent_id', 'respondent_token',
        'answers', 'ip_address', 'user_agent',
        'completion_seconds', 'submitted_at',
    ];

    protected $casts = [
        'answers'      => 'array',
        'submitted_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($r) {
            if (empty($r->respondent_token)) {
                $r->respondent_token = Str::random(48);
            }
            if (empty($r->submitted_at)) {
                $r->submitted_at = now();
            }
        });
    }

    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    public function respondent()
    {
        return $this->belongsTo(User::class, 'respondent_id');
    }

    // Get answer for a specific question
    public function getAnswer(int $questionId): mixed
    {
        return $this->answers[$questionId] ?? null;
    }
}