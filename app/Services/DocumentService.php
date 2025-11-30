<?php

namespace App\Services;

use App\Models\Document;
use App\Repositories\Interfaces\DocumentRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class DocumentService
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository
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

        if (!$document->hasAccess(Auth::user())) {
            throw new AccessDeniedHttpException('You do not have access to this document.');
        }

        return $document;
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
}
