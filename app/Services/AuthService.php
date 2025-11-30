<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use PHPOpenSourceSaver\JWTAuth\JWTAuth;

class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly JWTAuth $jwt,
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

        $token = $this->jwt->fromUser($user);

        return $this->tokenResponse($user, $token);
    }

    /**
     * Authenticate user and generate token.
     */
    public function login(array $credentials): array
    {
        $token = $this->jwt->attempt($credentials);

        if (!$token) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = $this->jwt->user();

        return $this->tokenResponse($user, $token);
    }

    /**
     * Refresh the JWT token.
     * Returns a new token if the current one is still valid or within refresh window.
     */
    public function refresh(): array
    {
        try {
            $newToken = $this->jwt->refresh($this->jwt->getToken());
            $user = $this->jwt->setToken($newToken)->toUser();

            return $this->tokenResponse($user, $newToken);
        } catch (TokenExpiredException) {
            throw new JWTException('Token has expired and cannot be refreshed');
        } catch (TokenInvalidException) {
            throw new JWTException('Token is invalid');
        }
    }

    /**
     * Logout user and invalidate token.
     */
    public function logout(): void
    {
        try {
            $this->jwt->invalidate($this->jwt->getToken());
        } catch (JWTException) {
            // Token might already be invalid, that's ok
        }
    }

    /**
     * Get the authenticated user.
     *
     * @throws JWTException
     */
    public function me(): User
    {
        $user = $this->jwt->user();

        if (!$user instanceof User) {
            throw new JWTException('User not authenticated');
        }

        return $user;
    }

    /**
     * Create a standardized token response array.
     *
     * @return array{user: User, token: string}
     */
    private function tokenResponse(User $user, string $token): array
    {
        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
