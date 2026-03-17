<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::create('payroll_records', function (Blueprint $table) {
        $table->id();
        $table->foreignId('payroll_period_id')->constrained('payroll_periods')->onDelete('cascade');
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->decimal('base_salary', 15, 2)->default(0);
        $table->decimal('total_allowances', 15, 2)->default(0);
        $table->decimal('total_deductions', 15, 2)->default(0);
        $table->decimal('overtime_amount', 15, 2)->default(0);
        $table->decimal('bonus_amount', 15, 2)->default(0);
        $table->decimal('tax_amount', 15, 2)->default(0);
        $table->decimal('social_security_amount', 15, 2)->default(0);
        $table->decimal('net_salary', 15, 2)->default(0);
        $table->integer('working_days')->default(0);
        $table->integer('present_days')->default(0);
        $table->integer('absent_days')->default(0);
        $table->decimal('leave_days_paid', 4, 1)->default(0);
        $table->decimal('leave_days_unpaid', 4, 1)->default(0);
        $table->decimal('overtime_hours', 5, 2)->default(0);
        $table->integer('late_minutes_total')->default(0);
        $table->enum('status', ['draft', 'confirmed'])->default('draft');
        $table->timestamps();

        $table->unique(['payroll_period_id', 'user_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('payroll_records');
}
};
