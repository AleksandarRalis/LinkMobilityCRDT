<?php

namespace App\Repositories;

use App\Models\DocumentShare;
use App\Repositories\Interfaces\DocumentShareRepositoryInterface;
use Illuminate\Support\Collection;

class DocumentShareRepository implements DocumentShareRepositoryInterface
{
    public function __construct(
        private readonly DocumentShare $model
    ) {}

    public function getSharesForDocument(int $documentId): Collection
    {
        return $this->model
            ->where('document_id', $documentId)
            ->with('user:id,name,email')
            ->get();
    }

    public function create(array $data): DocumentShare
    {
        return $this->model->create($data);
    }

    public function delete(int $documentId, int $userId): bool
    {
        return $this->model
            ->where('document_id', $documentId)
            ->where('user_id', $userId)
            ->delete() > 0;
    }
}

