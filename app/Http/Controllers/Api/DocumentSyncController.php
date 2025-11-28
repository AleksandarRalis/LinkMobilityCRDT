<?php

namespace App\Http\Controllers\Api;

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
    private const SNAPSHOT_TIME_THRESHOLD = 10;   // Or every 10 seconds

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
            'update_count' => 'required|integer',
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

        // Check time threshold (10 seconds since last snapshot)
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
     * Get version history (paginated, 10 per page).
     * Page number is automatically read from request query parameter.
     */
    public function versions(Request $request, int $id): JsonResponse
    {
        $result = $this->documentService->getVersionHistory($id);

        return response()->json([
            'versions' => $result['data'],
            'pagination' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'per_page' => 10,
                'last_page' => $result['last_page'],
            ],
        ]);
    }

    /**
     * Preview a specific version (get content without restoring).
     */
    public function previewVersion(int $id, int $versionNumber): JsonResponse
    {
        try {
            $result = $this->documentService->getVersionContent($id, $versionNumber);

            return response()->json([
                'content' => $result['content'],
                'version_number' => $result['version_number'],
                'created_at' => $result['created_at'],
                'user' => $result['user'],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Restore to a specific version.
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'version_number' => 'required|integer|min:1',
        ]);

        $versionNumber = $this->documentService->restoreToVersion($id, $validated['version_number']);

        // Get updated document
        $result = $this->documentService->getDocumentWithContent($id);
        $user = Auth::user();


        return response()->json([
            'message' => 'Document restored',
            'content' => $result['content'],
            'version_number' => $versionNumber,
        ]);
    }
}

