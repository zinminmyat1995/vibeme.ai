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
    Schema::create('employee_payroll_profiles', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
        $table->foreignId('salary_rule_id')->constrained('salary_rules')->onDelete('cascade');
        $table->decimal('base_salary', 15, 2);
        $table->string('bank_name')->nullable();
        $table->string('bank_account_number')->nullable();
        $table->string('bank_account_holder_name')->nullable();
        $table->string('bank_branch')->nullable();
        $table->date('effective_date');
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('employee_payroll_profiles');
}
};
