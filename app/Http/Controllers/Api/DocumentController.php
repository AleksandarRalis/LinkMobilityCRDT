<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Document\CreateDocumentRequest;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentService $documentService
    ) {}

    /**
     * Get all documents for the authenticated user.
     */
    public function index(): JsonResponse
    {
        $documents = $this->documentService->getDocumentsForUser();

        return response()->json([
            'documents' => $documents,
        ]);
    }

    /**
     * Get a specific document with content for initial load.
     */
    public function show(int $id): JsonResponse
    {
        $result = $this->documentService->getDocumentWithContent($id);

        return response()->json([
            'document' => $result['document'],
            'content' => $result['content'],    
            'version_number' => $result['version_number'],
        ]);
    }

    /**
     * Create a new document.
     */
    public function store(CreateDocumentRequest $request): JsonResponse
    {
        $document = $this->documentService->createDocument($request->validated());

        return response()->json([
            'message' => 'Document created successfully',
            'document' => $document,
        ], 201);
    }
}

