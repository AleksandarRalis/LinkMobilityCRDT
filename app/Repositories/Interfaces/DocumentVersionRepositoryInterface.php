<?php

namespace App\Repositories\Interfaces;

use App\Models\DocumentVersion;
use Illuminate\Pagination\LengthAwarePaginator;

interface DocumentVersionRepositoryInterface
{
    /**
     * Get all versions for a document (paginated, 10 per page).
     * Page number is automatically read from request.
     */
    public function getByDocumentId(int $documentId): LengthAwarePaginator;

    /**
     * Get the latest version for a document.
     */
    public function getLatestByDocumentId(int $documentId): ?DocumentVersion;

    /**
     * Get a specific version by document ID and version number.
     */
    public function getByDocumentIdAndVersion(int $documentId, int $versionNumber): ?DocumentVersion;

    /**
     * Create a new document version.
     */
    public function create(array $data): DocumentVersion;
}

