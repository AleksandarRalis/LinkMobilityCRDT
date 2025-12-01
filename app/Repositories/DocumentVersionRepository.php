<?php

namespace App\Repositories;

use App\Models\DocumentVersion;
use App\Repositories\Interfaces\DocumentVersionRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class DocumentVersionRepository implements DocumentVersionRepositoryInterface
{
    public function __construct(
        private readonly DocumentVersion $model
    ) {}

    /**
     * Get all versions for a document (paginated, 10 per page).
     * Page number is automatically read from request.
     */
    public function getByDocumentId(int $documentId): LengthAwarePaginator
    {
        return $this->model
            ->where('document_id', $documentId)
            ->with('user:id,name')
            ->orderBy('version_number', 'desc')
            ->paginate(10);
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
            ->with('user:id,name')
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

