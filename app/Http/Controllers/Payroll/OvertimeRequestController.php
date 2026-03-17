<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreOvertimeRequestRequest;
use App\Models\OvertimeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OvertimeRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = OvertimeRequest::with('user');

        $user = Auth::user();

        if ($user->hasRole('member')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('management')) {
            $query->whereHas('user', fn($q) => $q->where('country_id', $user->country_id));
        }

        $requests = $query
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->orderByDesc('date')
            ->get();

        return response()->json($requests);
    }

    public function store(StoreOvertimeRequestRequest $request): JsonResponse
    {
        $ot = OvertimeRequest::create([
            ...$request->validated(),
            'user_id' => Auth::id(),
            'status' => 'pending',
        ]);

        return response()->json($ot, 201);
    }

    public function approve(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $overtimeRequest->update([
            'status' => 'approved',
            'hours_approved' => $request->input('hours_approved', $overtimeRequest->hours_requested),
            'approved_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Overtime request approved']);
    }

    public function reject(OvertimeRequest $overtimeRequest): JsonResponse
    {
        $overtimeRequest->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Overtime request rejected']);
    }
}