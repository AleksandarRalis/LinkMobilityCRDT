<?php

namespace App\Services;

use Symfony\Component\HttpFoundation\Cookie;

class TokenCookieService
{
    private const EXPIRY_OFFSET_SECONDS = 3600;

    /**
     * Create a cookie with the given token value.
     */
    public function createTokenCookie(string $token): Cookie
    {
        return $this->createBaseCookie()
            ->withValue($token)
            ->withExpires(time() + (config('jwt.cookie.expiry_minutes') * 60));
    }

    /**
     * Create an expired cookie to clear the token.
     */
    public function createExpiredCookie(): Cookie
    {
        return $this->createBaseCookie()
            ->withValue('')
            ->withExpires(time() - self::EXPIRY_OFFSET_SECONDS);
    }

    /**
     * Create a base cookie with common settings.
     */
    private function createBaseCookie(): Cookie
    {
        return Cookie::create(config('jwt.cookie.name'))
            ->withPath(config('jwt.cookie.path'))
            ->withDomain(config('jwt.cookie.domain'))
            ->withHttpOnly(config('jwt.cookie.http_only'))
            ->withSecure(config('jwt.cookie.secure'))
            ->withSameSite(config('jwt.cookie.same_site'));
    }
}
