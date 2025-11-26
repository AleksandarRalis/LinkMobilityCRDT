<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'content',
    ];

    /**
     * Get the user that owns the document.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get users this document is shared with.
     */
    public function sharedWith(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'document_shares')
            ->withPivot('permission')
            ->withTimestamps();
    }

    /**
     * Get all shares for this document.
     */
    public function shares(): HasMany
    {
        return $this->hasMany(DocumentShare::class);
    }

    /**
     * Check if a user has access to this document (owner or shared).
     */
    public function hasAccess(User $user): bool
    {
        return $this->user_id === $user->id || $this->sharedWith()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if a user can edit this document.
     */
    public function canEdit(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->sharedWith()
            ->where('user_id', $user->id)
            ->wherePivot('permission', 'edit')
            ->exists();
    }

    /**
     * Get all events for this document.
     */
    public function events(): HasMany
    {
        return $this->hasMany(DocumentEvent::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get all versions for this document.
     */
    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class)->orderBy('version_number', 'desc');
    }
}

