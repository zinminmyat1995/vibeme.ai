<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('salary_rules', function (Blueprint $table) {
        // pay_cycle, probation_days, country_id ရှိပြီး — မထည့်ရ

        // bank_export_format ကို bank_id နဲ့ replace လုပ်မယ်
        $table->foreignId('bank_id')->nullable()
              ->constrained('payroll_banks')->onDelete('set null')->after('probation_days');

        // အသစ်တွေပဲ ထည့်မယ်
        $table->integer('working_hours_per_day')->default(8)->nullable()->after('bank_id');
        $table->integer('working_days_per_week')->default(5)->nullable()->after('working_hours_per_day');
        $table->enum('overtime_base', ['daily_rate', 'hourly_rate'])
              ->default('hourly_rate')->nullable()->after('working_days_per_week');
        $table->enum('late_deduction_unit', ['per_minute', 'per_hour'])
              ->default('per_minute')->nullable()->after('overtime_base');
        $table->decimal('late_deduction_rate', 10, 2)
              ->default(0)->nullable()->after('late_deduction_unit');
        $table->foreignId('currency_id')->nullable()
              ->constrained('payroll_currencies')->onDelete('set null')->after('late_deduction_rate');
    });
}

public function down(): void
{
    Schema::table('salary_rules', function (Blueprint $table) {
        $table->dropForeign(['bank_id']);
        $table->dropForeign(['currency_id']);
        $table->dropColumn([
            'bank_id',
            'working_hours_per_day',
            'working_days_per_week',
            'overtime_base',
            'late_deduction_unit',
            'late_deduction_rate',
            'currency_id',
        ]);
    });
}
};