<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_bonus_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->foreignId('bonus_type_id')->constrained('payroll_bonus_types')->onDelete('cascade');
            $table->enum('frequency', ['monthly', 'quarterly', 'yearly', 'once']);
            $table->tinyInteger('pay_month')->nullable();    // 1-12 for yearly/once
            $table->tinyInteger('pay_quarter')->nullable();  // 1-4 for quarterly
            $table->string('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_bonus_schedules');
    }
};