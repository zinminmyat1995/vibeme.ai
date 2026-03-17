<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_custom_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->string('rule_name');                          // e.g. "NSSF", "Housing Fund"
            $table->enum('type', ['percentage', 'flat']);         // % or flat amount
            $table->decimal('value', 10, 2);                     // rate or amount
            $table->enum('applies_to', ['employee', 'employer', 'both'])->default('both');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_custom_rules');
    }
};