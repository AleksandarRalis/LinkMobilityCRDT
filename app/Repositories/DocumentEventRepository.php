<?php

namespace App\Repositories;

use App\Models\DocumentEvent;
use App\Repositories\Interfaces\DocumentEventRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DocumentEventRepository implements DocumentEventRepositoryInterface
{
    public function __construct(
        protected DocumentEvent $model
    ) {}

    /**
     * Get all events for a document (ordered by creation time).
     */
    public function getByDocumentId(int $documentId): Collection
    {
        return $this->model
            ->where('document_id', $documentId)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Create a new document event.
     */
    public function create(array $data): DocumentEvent
    {
        return $this->model->create($data);
    }
}

