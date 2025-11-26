<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use App\Repositories\Interfaces\DocumentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class DocumentService
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository,
        protected DocumentReconstructionService $reconstructionService
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

        return [
            'document' => $document,
            'content' => $this->reconstructionService->getDocumentContent($document),
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
     * Get version history.
     */
    public function getVersionHistory(int $id): array
    {
        $document = $this->getDocument($id);
        return $this->reconstructionService->getVersionHistory($document);
    }

    /**
     * Restore to a specific version.
     */
    public function restoreToVersion(int $id, int $versionNumber): void
    {
        $document = $this->getDocument($id);
        $this->reconstructionService->restoreToVersion($document, $versionNumber);
    }
}

