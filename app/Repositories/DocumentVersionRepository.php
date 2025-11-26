<?php

namespace App\Repositories;

use App\Models\DocumentVersion;
use App\Repositories\Interfaces\DocumentVersionRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DocumentVersionRepository implements DocumentVersionRepositoryInterface
{
    public function __construct(
        protected DocumentVersion $model
    ) {}

    /**
     * Get all versions for a document.
     */
    public function getByDocumentId(int $documentId): Collection
    {
        return $this->model
            ->where('document_id', $documentId)
            ->orderBy('version_number', 'desc')
            ->get();
    }

    /**
     * Get the latest version for a document.
     */
    public function getLatestByDocumentId(int $documentId): ?DocumentVersion
    {
        return $this->model
            ->where('document_id', $documentId)
            ->orderBy('version_number', 'desc')
            ->first();
    }

    /**
     * Get a specific version by document ID and version number.
     */
    public function getByDocumentIdAndVersion(int $documentId, int $versionNumber): ?DocumentVersion
    {
        return $this->model
            ->where('document_id', $documentId)
            ->where('version_number', $versionNumber)
            ->first();
    }

    /**
     * Create a new document version.
     */
    public function create(array $data): DocumentVersion
    {
        return $this->model->create($data);
    }
}

