<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentSyncController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

/*
|--------------------------------------------------------------------------
| Broadcasting Authentication (JWT)
|--------------------------------------------------------------------------
|
| This endpoint authenticates WebSocket channel subscriptions using JWT.
| The frontend sends the JWT token in the Authorization header.
|
*/
Broadcast::routes(['middleware' => ['auth:api']]);

/*
|--------------------------------------------------------------------------
| Authentication Routes (Public)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (JWT Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Documents
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);

    // Document Sync (Yjs)
    Route::post('/documents/{id}/save', [DocumentSyncController::class, 'save']);
    Route::post('/documents/{id}/snapshot', [DocumentSyncController::class, 'createSnapshot']);
    Route::get('/documents/{id}/versions', [DocumentSyncController::class, 'versions']);
    Route::post('/documents/{id}/restore', [DocumentSyncController::class, 'restore']);
});

