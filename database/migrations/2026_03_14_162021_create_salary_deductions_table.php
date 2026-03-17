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
        Schema::create('salary_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salary_rule_id')->constrained('salary_rules')->onDelete('cascade');
            $table->string('name'); // Late penalty, Loan, Advance...
            $table->decimal('amount_per_unit', 15, 2)->default(0);
            $table->enum('unit_type', ['per_minute', 'per_day', 'fixed'])->default('fixed');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_deductions');
    }
};
