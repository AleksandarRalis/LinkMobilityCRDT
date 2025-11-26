<?php

namespace App\Repositories;

use App\Models\Document;
use App\Models\DocumentShare;
use App\Models\User;
use App\Repositories\Interfaces\DocumentShareRepositoryInterface;
use Illuminate\Support\Collection;

class DocumentShareRepository implements DocumentShareRepositoryInterface
{
    public function findByDocumentAndUser(int $documentId, int $userId): ?DocumentShare
    {
        return DocumentShare::where('document_id', $documentId)
            ->where('user_id', $userId)
            ->first();
    }

    public function getSharesForDocument(int $documentId): Collection
    {
        return DocumentShare::where('document_id', $documentId)
            ->with('user:id,name,email')
            ->get();
    }

    public function getSharedDocumentsForUser(int $userId): Collection
    {
        return Document::whereHas('shares', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->with('user:id,name')->get();
    }

    public function create(array $data): DocumentShare
    {
        return DocumentShare::create($data);
    }

    public function delete(int $documentId, int $userId): bool
    {
        return DocumentShare::where('document_id', $documentId)
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    public function userHasAccess(int $documentId, int $userId): bool
    {
        $document = Document::find($documentId);
        
        if (!$document) {
            return false;
        }

        // Owner always has access
        if ($document->user_id === $userId) {
            return true;
        }

        // Check if shared
        return DocumentShare::where('document_id', $documentId)
            ->where('user_id', $userId)
            ->exists();
    }
}

