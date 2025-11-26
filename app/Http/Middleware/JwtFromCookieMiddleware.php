<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtFromCookieMiddleware
{
    /**
     * Handle an incoming request.
     * Extract JWT from HTTP-only cookie and add to Authorization header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('token');

        if ($token && !$request->hasHeader('Authorization')) {
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}

