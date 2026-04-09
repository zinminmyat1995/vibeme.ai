<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\SalaryAllowance;
use App\Models\SalaryDeduction;
use App\Models\SalaryRule;
use App\Models\SocialSecurityRule;
use App\Models\TaxBracket;
use Illuminate\Database\Seeder;

class SalaryRuleSeeder extends Seeder
{
    public function run(): void
    {
        // Myanmar
        $myanmar = Country::where('name', 'Myanmar')->first();
        $mmRule = SalaryRule::create([
            'country_id' => $myanmar->id,
            'name' => 'Myanmar Standard',
            'base_salary_type' => 'fixed',
            'is_active' => true,
        ]);
        $this->createAllowances($mmRule->id, [
            ['name' => 'Transport Allowance', 'amount' => 30000, 'is_percentage' => false],
            ['name' => 'Meal Allowance', 'amount' => 50000, 'is_percentage' => false],
        ]);
        $this->createDeductions($mmRule->id, [
            ['name' => 'Late Penalty', 'amount_per_unit' => 500, 'unit_type' => 'per_minute'],
        ]);
        $this->createTaxBrackets($mmRule->id, [
            ['min' => 0, 'max' => 2000000, 'rate' => 0],
            ['min' => 2000000, 'max' => 5000000, 'rate' => 5],
            ['min' => 5000000, 'max' => 10000000, 'rate' => 10],
            ['min' => 10000000, 'max' => 20000000, 'rate' => 15],
            ['min' => 20000000, 'max' => null, 'rate' => 20],
        ]);
        SocialSecurityRule::create([
            'salary_rule_id' => $mmRule->id,
            'employee_rate_percentage' => 2,
            'employer_rate_percentage' => 3,
            'is_active' => true,
        ]);

        // Cambodia
        $cambodia = Country::where('name', 'Cambodia')->first();
        $khRule = SalaryRule::create([
            'country_id' => $cambodia->id,
            'name' => 'Cambodia Standard',
            'base_salary_type' => 'fixed',
            'is_active' => true,
        ]);
        $this->createAllowances($khRule->id, [
            ['name' => 'Transport Allowance', 'amount' => 20000, 'is_percentage' => false],
            ['name' => 'Meal Allowance', 'amount' => 30000, 'is_percentage' => false],
        ]);
        $this->createDeductions($khRule->id, [
            ['name' => 'Late Penalty', 'amount_per_unit' => 300, 'unit_type' => 'per_minute'],
        ]);
        $this->createTaxBrackets($khRule->id, [
            ['min' => 0, 'max' => 1500000, 'rate' => 0],
            ['min' => 1500000, 'max' => 2000000, 'rate' => 5],
            ['min' => 2000000, 'max' => 8500000, 'rate' => 10],
            ['min' => 8500000, 'max' => 12500000, 'rate' => 15],
            ['min' => 12500000, 'max' => null, 'rate' => 20],
        ]);
        SocialSecurityRule::create([
            'salary_rule_id' => $khRule->id,
            'employee_rate_percentage' => 2,
            'employer_rate_percentage' => 2.6,
            'is_active' => true,
        ]);

        // Japan
        $japan = Country::where('name', 'Japan')->first();
        $jpRule = SalaryRule::create([
            'country_id' => $japan->id,
            'name' => 'Japan Standard',
            'base_salary_type' => 'fixed',
            'is_active' => true,
        ]);
        $this->createAllowances($jpRule->id, [
            ['name' => 'Transport Allowance', 'amount' => 15000, 'is_percentage' => false],
            ['name' => 'Housing Allowance', 'amount' => 30000, 'is_percentage' => false],
        ]);
        $this->createDeductions($jpRule->id, [
            ['name' => 'Late Penalty', 'amount_per_unit' => 100, 'unit_type' => 'per_minute'],
        ]);
        $this->createTaxBrackets($jpRule->id, [
            ['min' => 0, 'max' => 1950000, 'rate' => 5],
            ['min' => 1950000, 'max' => 3300000, 'rate' => 10],
            ['min' => 3300000, 'max' => 6950000, 'rate' => 20],
            ['min' => 6950000, 'max' => 9000000, 'rate' => 23],
            ['min' => 9000000, 'max' => 18000000, 'rate' => 33],
            ['min' => 18000000, 'max' => null, 'rate' => 40],
        ]);
        SocialSecurityRule::create([
            'salary_rule_id' => $jpRule->id,
            'employee_rate_percentage' => 9.15,
            'employer_rate_percentage' => 9.15,
            'is_active' => true,
        ]);

        // Vietnam
        $vietnam = Country::where('name', 'Vietnam')->first();
        $vnRule = SalaryRule::create([
            'country_id' => $vietnam->id,
            'name' => 'Vietnam Standard',
            'base_salary_type' => 'fixed',
            'is_active' => true,
        ]);
        $this->createAllowances($vnRule->id, [
            ['name' => 'Transport Allowance', 'amount' => 500000, 'is_percentage' => false],
            ['name' => 'Meal Allowance', 'amount' => 730000, 'is_percentage' => false],
        ]);
        $this->createDeductions($vnRule->id, [
            ['name' => 'Late Penalty', 'amount_per_unit' => 5000, 'unit_type' => 'per_minute'],
        ]);
        $this->createTaxBrackets($vnRule->id, [
            ['min' => 0, 'max' => 5000000, 'rate' => 5],
            ['min' => 5000000, 'max' => 10000000, 'rate' => 10],
            ['min' => 10000000, 'max' => 18000000, 'rate' => 15],
            ['min' => 18000000, 'max' => 32000000, 'rate' => 20],
            ['min' => 32000000, 'max' => 52000000, 'rate' => 25],
            ['min' => 52000000, 'max' => 80000000, 'rate' => 30],
            ['min' => 80000000, 'max' => null, 'rate' => 35],
        ]);
        SocialSecurityRule::create([
            'salary_rule_id' => $vnRule->id,
            'employee_rate_percentage' => 10.5,
            'employer_rate_percentage' => 21.5,
            'is_active' => true,
        ]);

        // Korea
        $korea = Country::where('name', 'Korea')->first();
        $krRule = SalaryRule::create([
            'country_id' => $korea->id,
            'name' => 'Korea Standard',
            'base_salary_type' => 'fixed',
            'is_active' => true,
        ]);
        $this->createAllowances($krRule->id, [
            ['name' => 'Transport Allowance', 'amount' => 200000, 'is_percentage' => false],
            ['name' => 'Meal Allowance', 'amount' => 200000, 'is_percentage' => false],
        ]);
        $this->createDeductions($krRule->id, [
            ['name' => 'Late Penalty', 'amount_per_unit' => 1000, 'unit_type' => 'per_minute'],
        ]);
        $this->createTaxBrackets($krRule->id, [
            ['min' => 0, 'max' => 14000000, 'rate' => 6],
            ['min' => 14000000, 'max' => 50000000, 'rate' => 15],
            ['min' => 50000000, 'max' => 88000000, 'rate' => 24],
            ['min' => 88000000, 'max' => 150000000, 'rate' => 35],
            ['min' => 150000000, 'max' => 300000000, 'rate' => 38],
            ['min' => 300000000, 'max' => null, 'rate' => 45],
        ]);
        SocialSecurityRule::create([
            'salary_rule_id' => $krRule->id,
            'employee_rate_percentage' => 9.32,
            'employer_rate_percentage' => 10.82,
            'is_active' => true,
        ]);

        // United States
        $us = Country::where('name', 'United States')->first();
        $usRule = SalaryRule::create([
            'country_id' => $us->id,
            'name' => 'US Standard',
            'base_salary_type' => 'fixed',
            'is_active' => true,
        ]);
        $this->createAllowances($usRule->id, [
            ['name' => 'Health Insurance', 'amount' => 500, 'is_percentage' => false],
            ['name' => 'Transport Allowance', 'amount' => 150, 'is_percentage' => false],
        ]);
        $this->createDeductions($usRule->id, [
            ['name' => 'Late Penalty', 'amount_per_unit' => 2, 'unit_type' => 'per_minute'],
        ]);
        $this->createTaxBrackets($usRule->id, [
            ['min' => 0, 'max' => 11600, 'rate' => 10],
            ['min' => 11600, 'max' => 47150, 'rate' => 12],
            ['min' => 47150, 'max' => 100525, 'rate' => 22],
            ['min' => 100525, 'max' => 191950, 'rate' => 24],
            ['min' => 191950, 'max' => 243725, 'rate' => 32],
            ['min' => 243725, 'max' => 609350, 'rate' => 35],
            ['min' => 609350, 'max' => null, 'rate' => 37],
        ]);
        SocialSecurityRule::create([
            'salary_rule_id' => $usRule->id,
            'employee_rate_percentage' => 7.65,
            'employer_rate_percentage' => 7.65,
            'is_active' => true,
        ]);
    }

    // ─────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────

    private function createAllowances(int $ruleId, array $allowances): void
    {
        foreach ($allowances as $a) {
            SalaryAllowance::create([
                'salary_rule_id' => $ruleId,
                'name' => $a['name'],
                'amount' => $a['amount'],
                'is_percentage' => $a['is_percentage'],
                'is_active' => true,
            ]);
        }
    }

    private function createDeductions(int $ruleId, array $deductions): void
    {
        foreach ($deductions as $d) {
            SalaryDeduction::create([
                // 'salary_rule_id' => $ruleId,
                'name' => $d['name'],
                'amount_per_unit' => $d['amount_per_unit'],
                'unit_type' => $d['unit_type'],
                'is_active' => true,
            ]);
        }
    }

    private function createTaxBrackets(int $ruleId, array $brackets): void
    {
        foreach ($brackets as $b) {
            TaxBracket::create([
                'salary_rule_id' => $ruleId,
                'min_amount' => $b['min'],
                'max_amount' => $b['max'],
                'tax_percentage' => $b['rate'],
            ]);
        }
    }
}