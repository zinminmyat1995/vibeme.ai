<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseRequest extends Model
{
    protected $fillable = [
        'user_id',
        'approver_id',
        'title',
        'description',
        'amount',
        'currency',
        'category',
        'expense_date',
        'attachments',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'payroll_period_id',
        'reimbursed_at',
        'hr_note',
    ];

    protected $casts = [
        'amount'        => 'decimal:2',
        'expense_date'  => 'date',
        'attachments'   => 'array',       // JSON → array auto cast
        'approved_at'   => 'datetime',
        'reimbursed_at' => 'datetime',
    ];

    // ── Category labels ───────────────────────────────────────
    const CATEGORIES = [
        'transport'     => 'Transport',
        'meal'          => 'Meal & Entertainment',
        'accommodation' => 'Accommodation',
        'equipment'     => 'Equipment & Supplies',
        'medical'       => 'Medical',
        'training'      => 'Training & Education',
        'communication' => 'Communication',
        'other'         => 'Other',
    ];

    const CATEGORY_ICONS = [
        'transport'     => '🚗',
        'meal'          => '🍽️',
        'accommodation' => '🏨',
        'equipment'     => '💻',
        'medical'       => '🏥',
        'training'      => '📚',
        'communication' => '📱',
        'other'         => '📋',
    ];

    // ── Relationships ──────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    // ── Helpers ────────────────────────────────────────────────

    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isApproved(): bool  { return $this->status === 'approved'; }
    public function isRejected(): bool  { return $this->status === 'rejected'; }
    public function isReimbursed(): bool { return $this->reimbursed_at !== null; }

    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? 'Other';
    }

    public function getCategoryIconAttribute(): string
    {
        return self::CATEGORY_ICONS[$this->category] ?? '📋';
    }

    // ── Scopes ────────────────────────────────────────────────

    public function scopePending($q)  { return $q->where('status', 'pending'); }
    public function scopeApproved($q) { return $q->where('status', 'approved'); }
    public function scopeRejected($q) { return $q->where('status', 'rejected'); }

    public function scopeNotReimbursed($q)
    {
        return $q->where('status', 'approved')
                 ->whereNull('reimbursed_at');
    }

    public function scopeForUser($q, int $userId)
    {
        return $q->where('user_id', $userId);
    }

    public function scopeForCountry($q, int $countryId)
    {
        return $q->whereHas('user', fn($u) => $u->where('country_id', $countryId));
    }
}