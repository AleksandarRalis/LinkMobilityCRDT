<?php

namespace App\Http\Controllers\Api;

use App\Events\DocumentUpdated;
use App\Http\Controllers\Controller;
use App\Services\DocumentService;
use App\Services\DocumentReconstructionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class DocumentSyncController extends Controller
{
    private const SNAPSHOT_UPDATE_THRESHOLD = 50; // Create snapshot every 50 updates
    private const SNAPSHOT_TIME_THRESHOLD = 30;   // Or every 30 seconds

    public function __construct(
        protected DocumentService $documentService,
        protected DocumentReconstructionService $reconstructionService
    ) {}

    /**
     * Save document state (called periodically by frontend).
     * Saves event, updates content, and creates snapshot if needed.
     */
    public function save(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'update_count' => 'required|integer|min:1',
        ]);

        // Verify access
        $document = $this->documentService->getDocument($id);

        // Save the event
        $this->reconstructionService->saveEvent($document, $validated['content'], 'update');

        // Check if we should create a snapshot
        $shouldSnapshot = $this->shouldCreateSnapshot($id, $validated['update_count']);

        if ($shouldSnapshot) {
            // Refresh document to get updated content
            $document->refresh();
            $this->reconstructionService->createVersionSnapshot($document);
            $this->resetSnapshotCounters($id);
        }

        return response()->json([
            'message' => 'Save successful',
            'snapshot_created' => $shouldSnapshot,
        ]);
    }

    /**
     * Check if we should create a snapshot based on update count or time.
     */
    private function shouldCreateSnapshot(int $documentId, int $updateCount): bool
    {
        $cacheKey = "doc_{$documentId}_last_snapshot";
        $lastSnapshotTime = Cache::get($cacheKey);

        // Check update count threshold
        if ($updateCount >= self::SNAPSHOT_UPDATE_THRESHOLD) {
            return true;
        }

        // Check time threshold (30 seconds since last snapshot)
        if ($lastSnapshotTime === null) {
            Cache::put($cacheKey, now()->timestamp, 3600);
            return false;
        }

        $secondsSinceLastSnapshot = now()->timestamp - $lastSnapshotTime;
        return $secondsSinceLastSnapshot >= self::SNAPSHOT_TIME_THRESHOLD;
    }

    /**
     * Reset snapshot counters after creating a snapshot.
     */
    private function resetSnapshotCounters(int $documentId): void
    {
        $cacheKey = "doc_{$documentId}_last_snapshot";
        Cache::put($cacheKey, now()->timestamp, 3600);
    }

    /**
     * Create a manual version snapshot.
     */
    public function createSnapshot(int $id): JsonResponse
    {
        $this->documentService->createSnapshot($id);
        $this->resetSnapshotCounters($id);

        return response()->json([
            'message' => 'Snapshot created',
        ]);
    }

    /**
     * Get version history.
     */
    public function versions(int $id): JsonResponse
    {
        $versions = $this->documentService->getVersionHistory($id);

        return response()->json([
            'versions' => $versions,
        ]);
    }

    /**
     * Restore to a specific version.
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'version_number' => 'required|integer|min:1',
        ]);

        $this->documentService->restoreToVersion($id, $validated['version_number']);

        // Get updated document
        $result = $this->documentService->getDocumentWithContent($id);
        $user = Auth::user();

        // Broadcast the restored content to all clients
        broadcast(new DocumentUpdated(
            documentId: $id,
            userId: $user->id,
            userName: $user->name,
            content: $result['content'] ?? '',
        ));

        return response()->json([
            'message' => 'Document restored',
            'content' => $result['content'],
        ]);
    }
}

