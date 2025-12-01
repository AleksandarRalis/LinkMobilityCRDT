<?php

namespace App\Repositories;

use App\Models\Document;
use App\Repositories\Interfaces\DocumentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DocumentRepository implements DocumentRepositoryInterface
{
    public function __construct(
        private readonly Document $model
    ) {}

    /**
     * Find a document by ID.
     */
    public function findById(int $id): ?Document
    {
        return $this->model->find($id);
    }

    /**
     * Get all documents for a user.
     */
    public function getByUserId(int $userId): Collection
    {
        return $this->model->where('user_id', $userId)->orderBy('updated_at', 'desc')->get();
    }

    /**
     * Create a new document.
     */
    public function create(array $data): Document
    {
        return $this->model->create($data);
    }

    /**
     * Update document content (Yjs snapshot).
     */
    public function updateContent(Document $document, string $content): Document
    {
        $document->update(['content' => $content]);
        return $document->fresh();
    }
}

