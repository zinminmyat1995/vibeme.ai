<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreCountryRequest;
use App\Http\Resources\Payroll\CountryResource;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CountryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $countries = Country::where('is_active', true)->get();
        return CountryResource::collection($countries);
    }

    public function store(StoreCountryRequest $request): CountryResource
    {
        $country = Country::create($request->validated());
        return new CountryResource($country);
    }

    public function show(Country $country): CountryResource
    {
        return new CountryResource($country->load([
            'publicHolidays',
            'salaryRules',
            'leavePolicies',
        ]));
    }

    public function update(StoreCountryRequest $request, Country $country): CountryResource
    {
        $country->update($request->validated());
        return new CountryResource($country);
    }

    public function destroy(Country $country): JsonResponse
    {
        $country->update(['is_active' => false]);
        return response()->json(['message' => 'Country deactivated successfully']);
    }
}