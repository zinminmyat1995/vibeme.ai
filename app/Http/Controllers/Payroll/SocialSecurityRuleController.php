<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreSocialSecurityRuleRequest;
use App\Models\SocialSecurityRule;
use Illuminate\Http\JsonResponse;

class SocialSecurityRuleController extends Controller
{
    public function index(SocialSecurityRule $socialSecurityRule): JsonResponse
    {
        $rules = SocialSecurityRule::where('salary_rule_id', $socialSecurityRule->salary_rule_id)
            ->where('is_active', true)
            ->get();

        return response()->json($rules);
    }

    public function store(StoreSocialSecurityRuleRequest $request): JsonResponse
    {
        $rule = SocialSecurityRule::create($request->validated());
        return response()->json($rule, 201);
    }

    public function update(StoreSocialSecurityRuleRequest $request, SocialSecurityRule $socialSecurityRule): JsonResponse
    {
        $socialSecurityRule->update($request->validated());
        return response()->json($socialSecurityRule);
    }

    public function destroy(SocialSecurityRule $socialSecurityRule): JsonResponse
    {
        $socialSecurityRule->update(['is_active' => false]);
        return response()->json(['message' => 'Social security rule deactivated successfully']);
    }
}