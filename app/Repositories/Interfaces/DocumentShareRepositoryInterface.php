<?php

namespace App\Repositories\Interfaces;

use App\Models\DocumentShare;
use Illuminate\Support\Collection;

interface DocumentShareRepositoryInterface
{
    public function findByDocumentAndUser(int $documentId, int $userId): ?DocumentShare;
    
    public function getSharesForDocument(int $documentId): Collection;
    
    public function create(array $data): DocumentShare;
    
    public function delete(int $documentId, int $userId): bool;
}

