<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_bonus_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->string('name');                                    // e.g. Annual Bonus, နှစ်ပြည့်ဘောနပ်
            $table->enum('calculation_type', ['flat', 'percentage']); // flat amount or % of salary
            $table->decimal('value', 10, 2);                          // amount or %
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['country_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_bonus_types');
    }
};