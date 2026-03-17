<?php
// app/Http/Controllers/UserController.php

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

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('role')
                 ->select('id','name','email','role_id','department',
                          'position','phone','is_active','country','avatar_url')
                 ->get();

        return Inertia::render('UserRoles', [
            'users' => $users,
            'roles' => Role::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|min:6',
            'role_id'    => 'required|exists:roles,id',
            'department' => 'nullable|string|max:255',
            'position'   => 'nullable|string|max:255',
            'phone'      => 'nullable|string|max:50',
            'avatar'     => 'nullable|image|max:2048',
            'country' => 'required|in:myanmar,vietnam,korea,cambodia,japan',
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $slug      = Str::slug($request->name);
            $ext       = $request->file('avatar')->getClientOriginalExtension();
            $fileName  = $slug . '-' . time() . '.' . $ext;
            $avatarPath = $request->file('avatar')->storeAs('user', $fileName, 'public');
        }

        $user = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role_id'    => $request->role_id,
            'department' => $request->department,
            'position'   => $request->position,
            'phone'      => $request->phone,
            'avatar_url' => $avatarPath,
            'is_active'  => true,
            'country'    => $request->country,
            
        ]);
        Mail::to($user->email)->send(new UserCreatedMail($user, $request->password));
        return back()->with('success', 'User created successfully!');
    }

 
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email,' . $user->id,
            'role_id'       => 'required|exists:roles,id',
            'department'    => 'nullable|string|max:255',
            'position'      => 'nullable|string|max:255',
            'phone'         => 'nullable|string|max:50',
            'password'      => 'nullable|min:6',
            'avatar'        => 'nullable|image|max:2048',
            'remove_avatar' => 'nullable|boolean',
            'country' => 'required|in:myanmar,vietnam,korea,cambodia,japan',
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

        $user->name       = $request->name;
        $user->email      = $request->email;
        $user->role_id    = $request->role_id;
        $user->department = $request->department;
        $user->position   = $request->position;
        $user->phone      = $request->phone;
        $user->is_active  = $request->boolean('is_active', true);
        $user->country    = $request->country;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();
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