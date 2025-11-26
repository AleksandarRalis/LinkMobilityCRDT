<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    private const TOKEN_COOKIE_NAME = 'token';
    private const TOKEN_EXPIRY_MINUTES = 60 * 24 * 7; // 7 days

    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return $this->respondWithToken($result['token'], $result['user'], 'User registered successfully', 201);
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
     * Logout user and invalidate token.
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        // Clear the token cookie
        $cookie = Cookie::create(self::TOKEN_COOKIE_NAME)
            ->withValue('')
            ->withExpires(time() - 3600)
            ->withPath('/')
            ->withHttpOnly(true)
            ->withSecure(config('app.env') === 'production')
            ->withSameSite('Lax');

        return response()->json([
            'message' => 'Successfully logged out',
        ])->withCookie($cookie);
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
    private function respondWithToken(string $token, $user, string $message, int $status = 200): JsonResponse
    {
        $cookie = Cookie::create(self::TOKEN_COOKIE_NAME)
            ->withValue($token)
            ->withExpires(time() + (self::TOKEN_EXPIRY_MINUTES * 60))
            ->withPath('/')
            ->withHttpOnly(true)
            ->withSecure(config('app.env') === 'production')
            ->withSameSite('Lax');

        return response()->json([
            'message' => $message,
            'user' => $user,
        ], $status)->withCookie($cookie);
    }
}

