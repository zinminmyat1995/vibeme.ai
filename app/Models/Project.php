<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    protected $fillable = [
        'name',
        'description',
        'status',
        'start_date',
        'end_date',
        'created_by',
        // P&L fields (new)
        'client_id',
        'contract_value',
        'currency',
        'est_team_size',
    ];

    protected $casts = [
        'start_date'     => 'date',
        'end_date'       => 'date',
        'contract_value' => 'decimal:2',
        'est_team_size'  => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ProjectAssignment::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AssignmentLog::class);
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(ProjectAssignment::class)->where('status', 'active');
    }

    // ── P&L Helpers ───────────────────────────────────────────

    // Active + upcoming assignments နှစ်မျိုးလုံး (cost calculation အတွက်)
    public function activeAndUpcomingAssignments(): HasMany
    {
        return $this->hasMany(ProjectAssignment::class)
                    ->whereIn('status', ['active', 'upcoming'])
                    ->with('user.payrollProfile')
                    ->orderBy('priority_order');
    }
}