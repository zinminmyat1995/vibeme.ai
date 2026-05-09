<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectAssignment extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'assigned_by',
        'start_date',
        'end_date',
        'hours_per_day',
        'priority_order', // new — Leave impact calculation အတွက်
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date'     => 'date',
        'end_date'       => 'date',
        'hours_per_day'  => 'integer',
        'priority_order' => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    // ── Availability Check ─────────────────────────────────────

    public static function isAvailable(int $userId, string $startDate, string $endDate, ?int $excludeId = null): bool
    {
        $query = static::where('user_id', $userId)
            ->where('status', '!=', 'removed')
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function ($q2) use ($startDate, $endDate) {
                      $q2->where('start_date', '<=', $startDate)
                         ->where('end_date', '>=', $endDate);
                  });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->count() < 3;
    }

    // ── Priority Helper ────────────────────────────────────────

    // User တစ်ယောက်ရဲ့ နောက်ဆုံး priority order ကြည့်ပြီး +1 return
    // Assignment ချတဲ့အချိန် auto-suggest priority အတွက် သုံးမယ်
    public static function nextPriorityFor(int $userId): int
    {
        $max = static::where('user_id', $userId)
                     ->whereIn('status', ['active', 'upcoming'])
                     ->max('priority_order');

        return ($max ?? 0) + 1;
    }
}