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
            // ❌ ဒီလို မဟုတ်ဘဲ
            // return redirect()->route('login');
            
            // ✅ API နဲ့ Web ခွဲပေး
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login');
        }

        $userRole = $request->user()->role?->name;

        if (!in_array($userRole, $roles)) {
            // ✅ ဒါလည်း ခွဲပေး
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}