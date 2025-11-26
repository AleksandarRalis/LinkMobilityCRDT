<?php

namespace App\Repositories\Interfaces;

use App\Models\Document;
use Illuminate\Database\Eloquent\Collection;

interface DocumentRepositoryInterface
{
    /**
     * Find a document by ID.
     */
    public function findById(int $id): ?Document;

    /**
     * Get all documents for a user.
     */
    public function getByUserId(int $userId): Collection;

    /**
     * Create a new document.
     */
    public function create(array $data): Document;

    /**
     * Update document content (Yjs snapshot).
     */
    public function updateContent(Document $document, string $content): Document;
}

