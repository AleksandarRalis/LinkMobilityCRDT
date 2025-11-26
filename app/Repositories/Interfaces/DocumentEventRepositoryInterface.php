<?php

namespace App\Repositories\Interfaces;

use App\Models\DocumentEvent;
use Illuminate\Database\Eloquent\Collection;

interface DocumentEventRepositoryInterface
{
    /**
     * Get all events for a document (ordered by creation time).
     */
    public function getByDocumentId(int $documentId): Collection;

    /**
     * Create a new document event.
     */
    public function create(array $data): DocumentEvent;
}

