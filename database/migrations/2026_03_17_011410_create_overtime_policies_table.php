<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('overtime_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->enum('calculation_method', ['multiplier', 'fixed'])->default('multiplier');
            $table->decimal('weekday_rate', 4, 2)->default(1.50);  // e.g. 1.5x
            $table->decimal('weekend_rate', 4, 2)->default(2.00);  // e.g. 2x
            $table->decimal('holiday_rate', 4, 2)->default(3.00);  // e.g. 3x
            $table->decimal('fixed_amount', 10, 2)->nullable();     // if method = fixed
            $table->integer('max_ot_hours_per_month')->default(60);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique('country_id'); // one policy per country
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_policies');
    }
};