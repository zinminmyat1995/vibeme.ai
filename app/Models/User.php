<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\ProjectAssignment;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'department',
        'position',
        'phone',
        'date_of_birth',
        'avatar_url',
        'is_active',
        'joined_date',
        'employment_type',
        'contract_end_date',
        'country',
        'country_id'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'joined_date'       => 'date',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ProjectAssignment::class);
    }

    /**
     * users.country (string e.g. "myanmar") → countries.name column
     * Controller မှာ $user->countryRecord?->id သုံးလို့ country_id ရမယ်
     */
    public function countryRecord(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country', 'name');
    }

    // ── Role Helpers ───────────────────────────────────────────────────────

    public function hasRole(string $role): bool
    {
        return $this->role?->name === $role;
    }

    /**
     * @param string[] $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role?->name, $roles, true);
    }

    public function isAdmin(): bool      { return $this->hasRole('admin'); }
    public function isHR(): bool         { return $this->hasRole('hr'); }
    public function isManagement(): bool { return $this->hasRole('management'); }
    public function isEmployee(): bool   { return $this->hasRole('employee'); }

    public function scopeHr($query)
    {
        return $query->whereHas('role', fn($q) => $q->where('name', 'hr'))
                    ->where('is_active', true);
    }

    public function scopeOfCountry($query, int $countryId)
    {
        return $query->where('country_id', $countryId);
    }
}