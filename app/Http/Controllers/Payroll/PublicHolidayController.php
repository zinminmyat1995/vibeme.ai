<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StorePublicHolidayRequest;
use App\Models\PublicHoliday;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicHolidayController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $holidays = PublicHoliday::query()
            ->when($request->country_id, fn($q) => $q->where('country_id', $request->country_id))
            ->when($request->year, fn($q) => $q->whereYear('date', $request->year))
            ->orderBy('date')
            ->get();

        return response()->json($holidays);
    }

    public function store(StorePublicHolidayRequest $request): JsonResponse
    {
        $holiday = PublicHoliday::create($request->validated());
        return response()->json($holiday, 201);
    }

    public function update(StorePublicHolidayRequest $request, PublicHoliday $publicHoliday): JsonResponse
    {
        $publicHoliday->update($request->validated());
        return response()->json($publicHoliday);
    }

    public function destroy(PublicHoliday $publicHoliday): JsonResponse
    {
        $publicHoliday->delete();
        return response()->json(['message' => 'Holiday deleted successfully']);
    }
}