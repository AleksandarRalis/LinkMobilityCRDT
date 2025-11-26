<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DocumentShareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentShareController extends Controller
{
    public function __construct(
        protected DocumentShareService $shareService
    ) {}

    /**
     * Share a document with a user.
     */
    public function share(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'permission' => 'in:view,edit',
        ]);

        try {
            $result = $this->shareService->shareWithEmail(
                $id,
                $request->email,
                $request->permission ?? 'edit'
            );

            return response()->json([
                'message' => 'Document shared successfully',
                'share' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Remove a share.
     */
    public function removeShare(int $documentId, int $userId): JsonResponse
    {
        try {
            $this->shareService->removeShare($documentId, $userId);

            return response()->json([
                'message' => 'Share removed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get all shares for a document.
     */
    public function getShares(int $id): JsonResponse
    {
        try {
            $shares = $this->shareService->getDocumentShares($id);

            return response()->json([
                'shares' => $shares,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get documents shared with current user.
     */
    public function sharedWithMe(): JsonResponse
    {
        $documents = $this->shareService->getSharedWithMe();

        return response()->json([
            'documents' => $documents,
        ]);
    }
}

