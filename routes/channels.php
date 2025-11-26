<?php

use App\Models\Document;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| User Notification Channel
|--------------------------------------------------------------------------
|
| Private channel for user-specific notifications.
|
*/
Broadcast::channel('App.Models.User.{id}', function (User $user, int $id) {
    return $user->id === $id;
});

/*
|--------------------------------------------------------------------------
| Document Collaboration Channel (Presence)
|--------------------------------------------------------------------------
|
| Presence channel for real-time document collaboration.
| Returns user info for presence tracking (shows who's online).
| Authorization: User must own the document OR be shared on the document.
|
*/
Broadcast::channel('document.{documentId}', function (User $user, int $documentId) {
    $document = Document::find($documentId);
    
    if (!$document) {
        return false;
    }
    
    // Check if user has access (owner OR shared)
    if ($document->hasAccess($user)) {
        return [
            'id' => $user->id,
            'name' => $user->name,
        ];
    }
    
    return false;
});
