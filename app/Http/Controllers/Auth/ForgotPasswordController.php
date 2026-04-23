<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class ForgotPasswordController extends Controller
{
    // ── Step 1: Show Forgot Password Page ─────────────────────────
    public function showForgotForm()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    // ── Step 2: Send Reset Link to Email ──────────────────────────
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Security: always return success (don't reveal if email exists)
        if (!$user) {
            return back()->with('status', 'sent');
        }

        // Delete old tokens for this email
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        // Generate token
        $token = Str::random(64);

        // Store hashed token
        DB::table('password_reset_tokens')->insert([
            'email'      => $request->email,
            'token'      => Hash::make($token),
            'created_at' => now(),
        ]);

        // Send email
        $resetUrl = url("/reset-password?token={$token}&email=" . urlencode($request->email));
        $logoUrl = config('app.url') . '/images/main-logo.svg';
        \Log::info($logoUrl);
        Mail::send('emails.reset-password', [
            'user'     => $user,
            'resetUrl' => $resetUrl,
            'logoUrl'  => $logoUrl, 
        ], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('VibeMe.AI — Reset Your Password');
        });

        return back()->with('status', 'sent');
    }

    // ── Step 3: Show Reset Password Form ──────────────────────────
    public function showResetForm(Request $request)
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $request->query('token'),
            'email' => $request->query('email'),
        ]);
    }

    // ── Step 4: Process Password Reset ────────────────────────────
public function resetPassword(Request $request)
{
    $request->validate([
        'token'                 => 'required',
        'email'                 => 'required|email',
        'password'              => 'required|min:8|confirmed',
        'password_confirmation' => 'required',
    ]);

    $record = DB::table('password_reset_tokens')
        ->where('email', $request->email)
        ->first();

    if (!$record) {
        return back()->withErrors(['email' => 'Invalid or expired reset link.']);
    }

    $createdAt = Carbon::parse($record->created_at);
    $expiresAt = $createdAt->copy()->addMinute();

    if (now()->greaterThan($expiresAt)) {
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return back()->withErrors([
            'token' => 'This reset link has expired. Please request a new one.'
        ]);
    }

    if (!Hash::check($request->token, $record->token)) {
        return back()->withErrors(['token' => 'Invalid reset token.']);
    }

    $user = User::where('email', $request->email)->first();

    if (!$user) {
        return back()->withErrors(['email' => 'User not found.']);
    }

    $user->update([
        'password' => Hash::make($request->password),
    ]);

    DB::table('password_reset_tokens')->where('email', $request->email)->delete();

    return redirect()->route('login')->with('status', 'password_reset');
}
}