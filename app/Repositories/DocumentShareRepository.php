<?php

namespace App\Repositories;

use App\Models\DocumentShare;
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
}

