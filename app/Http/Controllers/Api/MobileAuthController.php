<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MobileAuthController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    // POST /api/v1/auth/login
    // ─────────────────────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'       => 'required|email',
            'password'    => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ]);

        // User ရှာ
        $user = User::with('role')
            ->where('email', $request->email)
            ->first();

        // Email / Password မမှန်ရင်
        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email သို့မဟုတ် Password မှားနေပါတယ်။'],
            ]);
        }

        // Account ပိတ်ထားရင်
        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'သင့် account ကို ပိတ်ထားပါတယ်။ Admin ကို ဆက်သွယ်ပါ။',
            ], 403);
        }

        // Device name — မပေးရင် default
        $deviceName = $request->device_name ?? 'mobile-app';

        // Token ထုတ်
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'success'    => true,
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => $this->formatUser($user),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/v1/auth/logout
    // Middleware: auth:sanctum
    // ─────────────────────────────────────────────────────────────
    public function logout(Request $request)
    {
        // ဒီ device ရဲ့ token တစ်ခုတည်း ဖျက်
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'ထွက်သွားပြီ',
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/v1/auth/me
    // Middleware: auth:sanctum
    // ─────────────────────────────────────────────────────────────
    public function me(Request $request)
    {
        $user = $request->user()->load('role');

        return response()->json($this->formatUser($user));
    }

    // ─────────────────────────────────────────────────────────────
    // Helper — user data format
    // ─────────────────────────────────────────────────────────────
    private function formatUser(User $user): array
    {
        // avatar_url က relative path ဖြစ်တာမို့ full URL ပြောင်း
        $avatarUrl = null;
        if ($user->avatar_url) {
            $avatarUrl = str_starts_with($user->avatar_url, 'http')
                ? $user->avatar_url
                : url('storage/' . $user->avatar_url);
        }

        return [
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'phone'           => $user->phone,
            'avatar_url'      => $avatarUrl,
            'country'         => $user->country,
            'department'      => $user->department,
            'position'        => $user->position,
            'employment_type' => $user->employment_type,
            'joined_date'     => $user->joined_date?->toDateString(),
            'is_active'       => $user->is_active,
            'role'            => [
                'id'           => $user->role?->id,
                'name'         => $user->role?->name,
                'display_name' => $user->role?->display_name,
            ],
        ];
    }
}