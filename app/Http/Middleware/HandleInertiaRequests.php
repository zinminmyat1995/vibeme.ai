<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user'   => $request->user() ? $request->user()->load('role') : null,
                'userId' => $request->user()?->id,
            ],
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
            // Share fresh CSRF token with every Inertia response
            'csrf_token' => csrf_token(),
            'status' => fn () => $request->session()->get('status'),
        ]);
    }
}