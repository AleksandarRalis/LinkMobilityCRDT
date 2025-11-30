<?php

namespace App\Repositories\Interfaces;

use App\Models\DocumentShare;
use Illuminate\Support\Collection;

interface DocumentShareRepositoryInterface
{
    public function getSharesForDocument(int $documentId): Collection;

    public function create(array $data): DocumentShare;

    public function delete(int $documentId, int $userId): bool;
}

