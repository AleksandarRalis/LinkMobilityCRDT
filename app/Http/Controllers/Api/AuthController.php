<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\TokenCookieService;
use Illuminate\Http\JsonResponse;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly TokenCookieService $tokenCookieService,
    ) {}

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return $this->respondWithToken(
            $result['token'],
            $result['user'],
            'User registered successfully',
            Response::HTTP_CREATED
        );
    }

    /**
     * Login user and return token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return $this->respondWithToken($result['token'], $result['user'], 'Login successful');
    }

    /**
     * Refresh the JWT token.
     */
    public function refresh(): JsonResponse
    {
        try {
            $result = $this->authService->refresh();

            return $this->respondWithToken($result['token'], $result['user'], 'Token refreshed successfully');
        } catch (JWTException $e) {
            return response()->json([
                'message' => 'Could not refresh token',
                'error' => $e->getMessage(),
            ], Response::HTTP_UNAUTHORIZED)->withCookie(
                $this->tokenCookieService->createExpiredCookie()
            );
        }
    }

    /**
     * Logout user and invalidate token.
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return response()->json([
            'message' => 'Successfully logged out',
        ])->withCookie($this->tokenCookieService->createExpiredCookie());
    }

    /**
     * Get authenticated user.
     */
    public function me(): JsonResponse
    {
        $user = $this->authService->me();

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Create response with HTTP-only cookie containing the token.
     */
    private function respondWithToken(
        string $token,
        User $user,
        string $message,
        int $status = Response::HTTP_OK
    ): JsonResponse {
        return response()->json([
            'message' => $message,
            'user' => $user,
        ], $status)->withCookie(
            $this->tokenCookieService->createTokenCookie($token)
        );
    }
}
