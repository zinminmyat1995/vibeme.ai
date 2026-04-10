<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Mail\UserCreatedMail;
use App\Mail\UserUpdatedMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function index()
    {
        $user     = Auth::user();
        $roleName = $user->role?->name;

        $query = User::with('role')
            ->select('id','name','email','role_id','department',
                    'position','phone','is_active','country','avatar_url',
                    'joined_date','employment_type','contract_end_date');

        // HR → own country only
        if ($roleName === 'hr') {
            $query->where('country', $user->country);
        }

        // Country filter (admin only)
        if ($roleName === 'admin' && request()->filled('country')) {
            $query->where('country', request('country'));
        }

        $users = $query->get();

        return Inertia::render('UserRoles', [
            'users'    => $users,
            'roles'    => Role::all(),
            'roleName' => $roleName,
        ]);


    }

    // ── Resolve employment type based on probation period ──
    // If manual type is permanent/contract → keep as-is
    // If probation → check if probation period has passed → auto promote to permanent
    private function resolveEmploymentType(string $joinedDate, string $requestedType, ?int $countryId): string
    {
        // Manual permanent or contract → respect user's choice
        if ($requestedType === 'permanent' || $requestedType === 'contract') {
            return $requestedType;
        }

        // Probation → check if period has passed
        $salaryRule    = \App\Models\SalaryRule::where('country_id', $countryId)->first();
        $probationDays = $salaryRule?->probation_days ?? 90;
        $probationEnd  = Carbon::parse($joinedDate)->addDays($probationDays);

        return Carbon::now()->gte($probationEnd) ? 'permanent' : 'probation';
    }

public function store(Request $request)
{
    $request->validate([
        'name'              => 'required|string|max:255',
        'email'             => 'required|email|unique:users,email',
        'password'          => 'required|min:6',
        'role_id'           => 'required|exists:roles,id',
        'department'        => 'nullable|string|max:255',
        'position'          => 'nullable|string|max:255',
        'phone'             => 'nullable|string|max:50',
        'avatar'            => 'nullable|image|max:2048',
        'country'           => 'required|in:myanmar,vietnam,korea,cambodia,japan',
        'joined_date'       => 'nullable|date',
        'employment_type'   => 'nullable|in:probation,permanent,contract',
        'contract_end_date' => 'nullable|required_if:employment_type,contract|date|after:today',
    ], [
        'contract_end_date.required_if' => 'Contract end date is required for contract employees.',
        'contract_end_date.after'       => 'Contract end date must be a future date.',
    ]);

    $avatarPath = null;
    if ($request->hasFile('avatar')) {
        $slug       = Str::slug($request->name);
        $ext        = $request->file('avatar')->getClientOriginalExtension();
        $fileName   = $slug . '-' . time() . '.' . $ext;
        $avatarPath = $request->file('avatar')->storeAs('user', $fileName, 'public');
    }

    // ── Target user's country_id for probation calculation ──
    $country   = \App\Models\Country::where('name', $request->country)->first();
    $countryId = $country?->id;

    $joinedDate     = $request->joined_date ?? now()->toDateString();
    $requestedType  = $request->employment_type ?? 'probation';
    $employmentType = $this->resolveEmploymentType($joinedDate, $requestedType, $countryId);

    $user = User::create([
        'name'              => $request->name,
        'email'             => $request->email,
        'password'          => Hash::make($request->password),
        'role_id'           => $request->role_id,
        'department'        => $request->department,
        'position'          => $request->position,
        'phone'             => $request->phone,
        'avatar_url'        => $avatarPath,
        'is_active'         => true,
        'country'           => $request->country,
        'country_id'        => $countryId,    
        'joined_date'       => $joinedDate,
        'employment_type'   => $employmentType,
        'contract_end_date' => $employmentType === 'contract' ? $request->contract_end_date : null,
    ]);

    if ($request->hasFile('avatar') || $request->boolean('remove_avatar')) {
        // toOthers() မသုံးပါနဲ့ — everyone ရောက်ဖို့
        broadcast(new \App\Events\UserAvatarUpdated(
            $user->id,
            $user->avatar_url,
        ));
    }

    Mail::to($user->email)->send(new UserCreatedMail($user, $request->password));
    return back()->with('success', 'User created successfully!');
}


public function update(Request $request, User $user)
{
    $request->validate([
        'name'              => 'required|string|max:255',
        'email'             => 'required|email|unique:users,email,' . $user->id,
        'role_id'           => 'required|exists:roles,id',
        'department'        => 'nullable|string|max:255',
        'position'          => 'nullable|string|max:255',
        'phone'             => 'nullable|string|max:50',
        'password'          => 'nullable|min:6',
        'avatar'            => 'nullable|image|max:2048',
        'remove_avatar'     => 'nullable|boolean',
        'country'           => 'required|in:myanmar,vietnam,korea,cambodia,japan',
        'joined_date'       => 'nullable|date',
        'employment_type'   => 'nullable|in:probation,permanent,contract',
        'contract_end_date' => 'nullable|required_if:employment_type,contract|date|after:today',
    ], [
        'contract_end_date.required_if' => 'Contract end date is required for contract employees.',
        'contract_end_date.after'       => 'Contract end date must be a future date.',
    ]);

    // ── Avatar Remove ──
    if ($request->boolean('remove_avatar')) {
        if ($user->avatar_url && Storage::disk('public')->exists($user->avatar_url)) {
            Storage::disk('public')->delete($user->avatar_url);
        }
        $user->avatar_url = null;
    }

    // ── Avatar Replace ──
    if ($request->hasFile('avatar')) {
        if ($user->avatar_url && Storage::disk('public')->exists($user->avatar_url)) {
            Storage::disk('public')->delete($user->avatar_url);
        }
        $slug     = Str::slug($request->name);
        $ext      = $request->file('avatar')->getClientOriginalExtension();
        $fileName = $slug . '-' . time() . '.' . $ext;
        $user->avatar_url = $request->file('avatar')->storeAs('user', $fileName, 'public');
    }

    // ── Resolve employment type with probation auto-detect ──
    $country   = \App\Models\Country::where('name', $request->country)->first();
    $countryId = $country?->id;

    $joinedDate     = $request->joined_date ?? $user->joined_date ?? now()->toDateString();
    $requestedType  = $request->employment_type ?? $user->employment_type ?? 'probation';
    $employmentType = $this->resolveEmploymentType($joinedDate, $requestedType, $countryId);

    $user->name              = $request->name;
    $user->email             = $request->email;
    $user->role_id           = $request->role_id;
    $user->department        = $request->department;
    $user->position          = $request->position;
    $user->phone             = $request->phone;
    $user->is_active         = $request->boolean('is_active', true);
    $user->country           = $request->country;
    $user->country_id        = $countryId;   
    $user->joined_date       = $joinedDate;
    $user->employment_type   = $employmentType;
    // Contract end date — contract ဆိုရင်ဘဲသိမ်း၊ တခြားဆိုရင် null
    $user->contract_end_date = $employmentType === 'contract' ? $request->contract_end_date : null;

    if ($request->filled('password')) {
        $user->password = Hash::make($request->password);
    }

    $user->save();
    // DEBUG ONLY
    \Log::info('Avatar broadcast attempt', [
        'user_id' => $user->id,
        'avatar_url' => $user->avatar_url,
        'has_avatar' => $request->hasFile('avatar'),
        'remove' => $request->boolean('remove_avatar'),
    ]);

    if ($request->hasFile('avatar') || $request->boolean('remove_avatar')) {
        \Log::info('Broadcasting UserAvatarUpdated');
        broadcast(new \App\Events\UserAvatarUpdated(
            $user->id,
            $user->avatar_url,
        ));
        \Log::info('Broadcast done');
    }

    Mail::to($user->email)->send(new UserUpdatedMail($user));
    return back()->with('success', 'User updated successfully!');
}

    public function destroy(User $user)
    {
        if ($user->avatar_url && Storage::disk('public')->exists($user->avatar_url)) {
            Storage::disk('public')->delete($user->avatar_url);
        }

        $user->delete();
        return back()->with('success', 'User deleted successfully!');
    }

    public function toggleStatus(User $user)
    {
        $user->update(['is_active' => !$user->is_active]);
        $status = $user->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "{$user->name} has been {$status}.");
    }
}