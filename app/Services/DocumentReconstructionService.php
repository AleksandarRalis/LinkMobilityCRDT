<?php

namespace App\Services;

use App\Models\Document;
use App\Repositories\Interfaces\DocumentEventRepositoryInterface;
use App\Repositories\Interfaces\DocumentVersionRepositoryInterface;
use App\Repositories\Interfaces\DocumentRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class DocumentReconstructionService
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository,
        protected DocumentEventRepositoryInterface $documentEventRepository,
        protected DocumentVersionRepositoryInterface $documentVersionRepository
    ) {}

    /**
     * Get document content for initial load.
     */
    public function getDocumentContent(Document $document): ?string
    {
        return $document->content;
    }

    /**
     * Save a new event and update the document's current content.
     */
    public function saveEvent(Document $document, string $content, string $eventType = 'update'): void
    {
        // Save the event
        $this->documentEventRepository->create([
            'document_id' => $document->id,
            'user_id' => Auth::id(),
            'event_type' => $eventType,
            'content' => $content,
        ]);

        // Update the document's current snapshot
        $this->documentRepository->updateContent($document, $content);
    }

    /**
     * Create a new version snapshot.
     */
    public function createVersionSnapshot(Document $document): void
    {
        if (!$document->content) {
            return;
        }

        // Get current version number
        $latestVersion = $this->documentVersionRepository->getLatestByDocumentId($document->id);
        $newVersionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;

        // Create new version
        $this->documentVersionRepository->create([
            'document_id' => $document->id,
            'user_id' => Auth::id(),
            'version_number' => $newVersionNumber,
            'content' => $document->content,
        ]);
    }

    /**
     * Get version history for a document.
     */
    public function getVersionHistory(Document $document): array
    {
        $versions = $this->documentVersionRepository->getByDocumentId($document->id);

        return $versions->map(fn($v) => [
            'id' => $v->id,
            'version_number' => $v->version_number,
            'user_id' => $v->user_id,
            'created_at' => $v->created_at,
        ])->toArray();
    }

    /**
     * Restore document to a specific version.
     */
    public function restoreToVersion(Document $document, int $versionNumber): void
    {
        $version = $this->documentVersionRepository->getByDocumentIdAndVersion(
            $document->id,
            $versionNumber
        );

        if (!$version) {
            throw new \InvalidArgumentException('Version not found.');
        }

        // Update document content to the version's content
        $this->documentRepository->updateContent($document, $version->content);

        // Save as a new event (for audit trail)
        $this->documentEventRepository->create([
            'document_id' => $document->id,
            'user_id' => Auth::id(),
            'event_type' => 'snapshot',
            'content' => $version->content,
        ]);
    }
}

