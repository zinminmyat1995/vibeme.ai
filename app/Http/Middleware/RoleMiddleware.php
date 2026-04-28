<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login');
        }

        $userRole = $request->user()->role?->name;

        // ✅ ဒါထည့် — pipe နဲ့ split လုပ်
        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode('|', $role) as $r) {
                $allowedRoles[] = trim($r);
            }
        }

        if (!in_array($userRole, $allowedRoles)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}