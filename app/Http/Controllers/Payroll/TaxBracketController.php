<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreTaxBracketRequest;
use App\Models\TaxBracket;
use Illuminate\Http\JsonResponse;

class TaxBracketController extends Controller
{
    public function index(TaxBracket $taxBracket): JsonResponse
    {
        $brackets = TaxBracket::where('salary_rule_id', $taxBracket->salary_rule_id)
            ->orderBy('min_amount')
            ->get();

        return response()->json($brackets);
    }

    public function store(StoreTaxBracketRequest $request): JsonResponse
    {
        $bracket = TaxBracket::create($request->validated());
        return response()->json($bracket, 201);
    }

    public function update(StoreTaxBracketRequest $request, TaxBracket $taxBracket): JsonResponse
    {
        $taxBracket->update($request->validated());
        return response()->json($taxBracket);
    }

    public function destroy(TaxBracket $taxBracket): JsonResponse
    {
        $taxBracket->delete();
        return response()->json(['message' => 'Tax bracket deleted successfully']);
    }
}