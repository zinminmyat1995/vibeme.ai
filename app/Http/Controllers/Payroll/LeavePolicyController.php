<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreLeavePolicyRequest;
use App\Models\LeavePolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeavePolicyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $policies = LeavePolicy::query()
            ->when($request->country_id, fn($q) => $q->where('country_id', $request->country_id))
            ->get();

        return response()->json($policies);
    }

    public function store(StoreLeavePolicyRequest $request): JsonResponse
    {
        $policy = LeavePolicy::create($request->validated());
        return response()->json($policy, 201);
    }

    public function update(StoreLeavePolicyRequest $request, LeavePolicy $leavePolicy): JsonResponse
    {
        $leavePolicy->update($request->validated());
        return response()->json($leavePolicy);
    }

    public function destroy(LeavePolicy $leavePolicy): JsonResponse
    {
        $leavePolicy->delete();
        return response()->json(['message' => 'Leave policy deleted successfully']);
    }
}