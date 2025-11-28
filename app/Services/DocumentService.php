<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use App\Repositories\Interfaces\DocumentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use App\Repositories\Interfaces\DocumentVersionRepositoryInterface;

class DocumentService
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository,
        protected DocumentReconstructionService $reconstructionService,
        protected DocumentVersionRepositoryInterface $documentVersionRepository
    ) {}

    /**
     * Get all documents for the authenticated user (owned + shared).
     */
    public function getDocumentsForUser(): array
    {
        $user = Auth::user();
        
        $owned = $this->documentRepository->getByUserId($user->id);
        $shared = $user->sharedDocuments()->with('user:id,name')->get();

        return [
            'owned' => $owned,
            'shared' => $shared,
        ];
    }

    /**
     * Get a specific document by ID.
     * Checks for both owner and shared access.
     */
    public function getDocument(int $id): Document
    {
        $document = $this->documentRepository->findById($id);

        if (!$document) {
            throw new NotFoundHttpException('Document not found.');
        }

        // Check if user has access (owner OR shared)
        if (!$document->hasAccess(Auth::user())) {
            throw new AccessDeniedHttpException('You do not have access to this document.');
        }

        return $document;
    }

    /**
     * Get document with content for initial load.
     */
    public function getDocumentWithContent(int $id): array
    {
        $document = $this->getDocument($id);
        $version_number = $this->documentVersionRepository->getLatestByDocumentId($document->id)->version_number ?? 1;

        return [
            'document' => $document,
            'content' => $this->reconstructionService->getDocumentContent($document),
            'version_number' => $version_number,
        ];
    }

    /**
     * Create a new document.
     */
    public function createDocument(array $data): Document
    {
        return $this->documentRepository->create([
            'user_id' => Auth::id(),
            'title' => $data['title'],
            'content' => null,
        ]);
    }

    /**
     * Save document update (event + snapshot).
     */
    public function saveUpdate(int $id, string $content): void
    {
        $document = $this->getDocument($id);
        $this->reconstructionService->saveEvent($document, $content, 'update');
    }

    /**
     * Create a version snapshot.
     */
    public function createSnapshot(int $id): void
    {
        $document = $this->getDocument($id);
        $this->reconstructionService->createVersionSnapshot($document);
    }

    /**
     * Get version history (paginated, 10 per page).
     * Page number is automatically read from request.
     */
    public function getVersionHistory(int $id): array
    {
        $document = $this->getDocument($id);
        return $this->reconstructionService->getVersionHistory($document);
    }

    /**
     * Get content for a specific version (preview without restoring).
     */
    public function getVersionContent(int $id, int $versionNumber): array
    {
        $document = $this->getDocument($id);
        return $this->reconstructionService->getVersionContent($document, $versionNumber);
    }

    /**
     * Restore to a specific version.
     */
    public function restoreToVersion(int $id, int $versionNumber): int
    {
        $document = $this->getDocument($id);
        $this->reconstructionService->restoreToVersion($document, $versionNumber);

        return $versionNumber;  
    }
}

