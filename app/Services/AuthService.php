<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    /**
     * Register a new user.
     */
    public function register(array $data): array
    {
        $user = $this->userRepository->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = JWTAuth::fromUser($user);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Authenticate user and generate token.
     */
    public function login(array $credentials): array
    {
        $token = JWTAuth::attempt($credentials);

        if (!$token) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = JWTAuth::user();

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Refresh the JWT token.
     * Returns a new token if the current one is still valid or within refresh window.
     */
    public function refresh(): array
    {
        try {
            $newToken = JWTAuth::refresh(JWTAuth::getToken());
            $user = JWTAuth::setToken($newToken)->toUser();

            return [
                'user' => $user,
                'token' => $newToken,
            ];
        } catch (TokenExpiredException $e) {
            throw new JWTException('Token has expired and cannot be refreshed');
        } catch (TokenInvalidException $e) {
            throw new JWTException('Token is invalid');
        } catch (JWTException $e) {
            throw $e;
        }
    }

    /**
     * Logout user and invalidate token.
     */
    public function logout(): void
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (JWTException $e) {
            // Token might already be invalid, that's ok
        }
    }

    /**
     * Get the authenticated user.
     */
    public function me(): User
    {
        return JWTAuth::user();
    }
}

