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
| Authorization: User must own the document or have access to it.
|
*/
Broadcast::channel('document.{documentId}', function (User $user, int $documentId) {
    // Check if user has access to this document
    $document = Document::find($documentId);
    
    if (!$document) {
        return false;
    }
    
    // Check if user owns the document (we'll expand this later for shared documents)
    if ($document->user_id === $user->id) {
        // Generate a consistent color based on user ID
        $colors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'];
        $color = $colors[$user->id % count($colors)];
        
        // Return user data for presence channel
        return [
            'id' => $user->id,
            'name' => $user->name,
            'color' => $color,
        ];
    }
    
    return false;
});
