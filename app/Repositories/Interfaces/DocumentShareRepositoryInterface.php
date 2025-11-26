<?php

namespace App\Repositories\Interfaces;

use App\Models\Document;
use App\Models\DocumentShare;
use App\Models\User;
use Illuminate\Support\Collection;

interface DocumentShareRepositoryInterface
{
    public function findByDocumentAndUser(int $documentId, int $userId): ?DocumentShare;
    
    public function getSharesForDocument(int $documentId): Collection;
    
    public function getSharedDocumentsForUser(int $userId): Collection;
    
    public function create(array $data): DocumentShare;
    
    public function delete(int $documentId, int $userId): bool;
    
    public function userHasAccess(int $documentId, int $userId): bool;
}

