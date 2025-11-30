<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use App\Repositories\Interfaces\DocumentRepositoryInterface;
use App\Repositories\Interfaces\DocumentShareRepositoryInterface;
use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DocumentShareService
{
    public function __construct(
        protected DocumentShareRepositoryInterface $shareRepository,
        protected DocumentRepositoryInterface $documentRepository,
        protected UserRepositoryInterface $userRepository
    ) {}

    /**
     * Share a document with a user by email.
     * Only the document owner can share.
     */
    public function shareWithEmail(int $documentId, string $email): array
    {
        $document = $this->documentRepository->findById($documentId);

        if (!$document) {
            throw new NotFoundHttpException('Document not found');
        }

        if ($document->user_id !== Auth::id()) {
            throw new AccessDeniedHttpException('Only the document owner can share this document');
        }

        $user = $this->userRepository->findByEmail($email)
            ?? throw new NotFoundHttpException('User not found with this email');

        if ($user->id === Auth::id()) {
            throw new \InvalidArgumentException('You cannot share a document with yourself');
        }

        if ($document->sharedWith()->where('user_id', $user->id)->exists()) {
            throw new \InvalidArgumentException('Document is already shared with this user');
        }

        $share = $this->shareRepository->create([
            'document_id' => $documentId,
            'user_id' => $user->id,
        ]);

        return [
            'share' => $share,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ];
    }

    /**
     * Remove a share.
     */
    public function removeShare(int $documentId, int $userId): bool
    {
        $document = $this->documentRepository->findById($documentId);
        
        if (!$document) {
            throw new \Exception('Document not found');
        }

        // Only owner can remove shares
        if ($document->user_id !== Auth::id()) {
            throw new \Exception('You do not have permission to manage shares for this document');
        }

        return $this->shareRepository->delete($documentId, $userId);
    }

    /**
     * Get all shares for a document.
     */
    public function getDocumentShares(int $documentId): Collection
    {
        $document = $this->documentRepository->findById($documentId);
        
        if (!$document) {
            throw new \Exception('Document not found');
        }

        // Only owner can view shares
        if ($document->user_id !== Auth::id()) {
            throw new \Exception('You do not have permission to view shares for this document');
        }

        return $this->shareRepository->getSharesForDocument($documentId);
    }
}

