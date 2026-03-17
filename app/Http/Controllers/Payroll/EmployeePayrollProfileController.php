<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreEmployeePayrollProfileRequest;
use App\Models\EmployeePayrollProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmployeePayrollProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profiles = EmployeePayrollProfile::with(['user', 'country', 'salaryRule'])
            ->when($request->country_id, fn($q) => $q->where('country_id', $request->country_id))
            ->where('is_active', true)
            ->get();

        return response()->json($profiles);
    }

    public function show(EmployeePayrollProfile $employeePayrollProfile): JsonResponse
    {
        // Member can only see own profile
        $user = Auth::user();
        if ($user->hasRole('member') && $employeePayrollProfile->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($employeePayrollProfile->load(['user', 'country', 'salaryRule']));
    }

    public function store(StoreEmployeePayrollProfileRequest $request): JsonResponse
    {
        // Deactivate old profile
        EmployeePayrollProfile::where('user_id', $request->user_id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $profile = EmployeePayrollProfile::create($request->validated());

        return response()->json($profile, 201);
    }

    public function update(StoreEmployeePayrollProfileRequest $request, EmployeePayrollProfile $employeePayrollProfile): JsonResponse
    {
        $employeePayrollProfile->update($request->validated());
        return response()->json($employeePayrollProfile);
    }
}