<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_profile_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_payroll_profile_id')
                  ->constrained('employee_payroll_profiles')
                  ->onDelete('cascade');
            $table->foreignId('payroll_allowance_id')
                  ->constrained('payroll_allowances')
                  ->onDelete('cascade');
            $table->timestamps();

            $table->unique(
                ['employee_payroll_profile_id', 'payroll_allowance_id'],
                'emp_profile_allowance_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_profile_allowances');
    }
};