<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRecord extends Model
{
    protected $fillable = [
        'payroll_period_id',
        'user_id',
        'year',
        'month',
        'base_salary',
        'total_allowances',
        'total_deductions',
        'overtime_amount',
        'bonus_amount',
        'expense_reimbursement',  // ← ထည့်
        'tax_amount',
        'social_security_amount',
        'net_salary',
        'working_days',
        'present_days',
        'absent_days',
        'leave_days_paid',
        'leave_days_unpaid',
        'overtime_hours',
        'late_minutes_total',
        'status',
    ];

    protected $casts = [
        'base_salary'            => 'decimal:2',
        'total_allowances'       => 'decimal:2',
        'total_deductions'       => 'decimal:2',
        'overtime_amount'        => 'decimal:2',
        'bonus_amount'           => 'decimal:2',
        'expense_reimbursement'  => 'decimal:2',  // ← ထည့်
        'tax_amount'             => 'decimal:2',
        'social_security_amount' => 'decimal:2',
        'net_salary'             => 'decimal:2',
        'leave_days_paid'        => 'decimal:1',
        'leave_days_unpaid'      => 'decimal:1',
        'overtime_hours'         => 'decimal:2',
        'year'                   => 'integer',
        'month'                  => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bonuses(): HasMany
    {
        return $this->hasMany(PayrollBonus::class);
    }

    // ── Expense requests reimbursed in this record ─────────────
    public function expenseRequests(): HasMany
    {
        return $this->hasMany(ExpenseRequest::class, 'payroll_period_id', 'payroll_period_id')
                    ->where('user_id', $this->user_id)
                    ->where('status', 'approved');
    }
}