<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Folder extends Model
{
    protected $fillable = [
        'user_id', 'parent_id', 'name', 'description',
        'visibility', 'branch', 'depth', 'color', 'icon',
    ];

    // ── Relationships ──────────────────────
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    // ── Permission Helpers ─────────────────
    public function canEdit(User $user): bool
    {
        return $user->isAdmin() || $this->user_id === $user->id;
    }

    public function canDelete(User $user): bool
    {
        return $user->isAdmin() || $this->user_id === $user->id;
    }

    // ── Visibility Scope ───────────────────
    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query; // admin → အကုန်မြင်
        }

        return $query->where(function ($q) use ($user) {
            $q->where('visibility', 'all')
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('visibility', 'branch')
                     ->where('branch', $user->branch ?? null);
              })
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('visibility', 'private')
                     ->where('user_id', $user->id);
              });
        });
    }
}