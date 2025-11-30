<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DocumentVersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DocumentVersionController extends Controller
{
    private const SNAPSHOT_UPDATE_THRESHOLD = 50;
    private const SNAPSHOT_TIME_THRESHOLD = 10;

    public function __construct(
        protected DocumentVersionService $versionService
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

        $document = $this->versionService->getDocument($id);

        $this->versionService->saveEvent($document, $validated['content'], 'update');

        $shouldSnapshot = $this->shouldCreateSnapshot($id, $validated['update_count']);

        if ($shouldSnapshot) {
            $document->refresh();
            $this->versionService->createVersionSnapshot($document);
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

        if ($updateCount >= self::SNAPSHOT_UPDATE_THRESHOLD) {
            return true;
        }

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
        $document = $this->versionService->getDocument($id);
        $this->versionService->createVersionSnapshot($document);
        $this->resetSnapshotCounters($id);

        return response()->json([
            'message' => 'Snapshot created',
        ]);
    }

    /**
     * Get version history (paginated, 10 per page).
     */
    public function versions(int $id): JsonResponse
    {
        $document = $this->versionService->getDocument($id);
        $result = $this->versionService->getVersionHistory($document);

        return response()->json([
            'versions' => $result['data'],
            'pagination' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'per_page' => $result['per_page'],
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
            $document = $this->versionService->getDocument($id);
            $result = $this->versionService->getVersionContent($document, $versionNumber);

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

        $document = $this->versionService->getDocument($id);
        $this->versionService->restoreToVersion($document, $validated['version_number']);

        $document->refresh();

        return response()->json([
            'message' => 'Document restored',
            'content' => $document->content,
            'version_number' => $validated['version_number'],
        ]);
    }
}
