<?php

namespace App\Repositories\Interfaces;

use App\Models\DocumentVersion;
use Illuminate\Database\Eloquent\Collection;

interface DocumentVersionRepositoryInterface
{
    /**
     * Get all versions for a document.
     */
    public function getByDocumentId(int $documentId): Collection;

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

