<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Survey extends Model
{
    protected $fillable = [
        'country_id', 'created_by', 'title', 'description',
        'status', 'is_anonymous', 'token', 'closes_at',
        'ai_insight', 'ai_insight_generated_at',
    ];

    protected $casts = [
        'is_anonymous'              => 'boolean',
        'closes_at'                 => 'datetime',
        'ai_insight_generated_at'   => 'datetime',
    ];

    // ── Boot — auto generate token ─────────
    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($survey) {
            if (empty($survey->token)) {
                $survey->token = Str::random(48);
            }
        });
    }

    // ── Relations ──────────────────────────
    public function questions()
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('order');
    }

    public function responses()
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    // ── Helpers ────────────────────────────
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isDraft(): bool    { return $this->status === 'draft'; }
    public function isClosed(): bool   { return $this->status === 'closed'; }

    public function isExpired(): bool
    {
        return $this->closes_at && $this->closes_at->isPast();
    }

    public function publicUrl(): string
    {
        return url('/survey/' . $this->token);
    }

    public function responseCount(): int
    {
        return $this->responses()->count();
    }

    public function responseRate(int $totalEmployees): float
    {
        if ($totalEmployees === 0) return 0;
        return round(($this->responseCount() / $totalEmployees) * 100, 1);
    }
}