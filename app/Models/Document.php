<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'user_id', 'folder_id', 'original_filename',
        'storage_path', 'file_type', 'file_size', 'page_count',
        'source_language', 'target_languages', 'translated_paths',
        'status', 'error_message', 'tags', 'visibility', 'branch',
    ];

    protected $casts = [
        'target_languages'  => 'array',
        'translated_paths'  => 'array',
        'tags'              => 'array',
    ];

    // ── Relationships ──────────────────────
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function folder()
    {
        return $this->belongsTo(Folder::class);
    }

    public function downloads()
    {
        return $this->hasMany(DocumentDownload::class);
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

    // ── Helpers ────────────────────────────
    public function getFileSizeFormatted(): string
    {
        $bytes = $this->file_size;
        if ($bytes < 1024)       return $bytes . ' B';
        if ($bytes < 1048576)    return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }

    public function hasTranslation(string $lang): bool
    {
        return isset($this->translated_paths[$lang]);
    }

    // ── Visibility Scope ───────────────────
    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query;
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