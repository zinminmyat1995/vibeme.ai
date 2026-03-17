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
    Schema::create('payroll_periods', function (Blueprint $table) {
        $table->id();
        $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
        $table->integer('month');
        $table->integer('year');
        $table->enum('status', ['draft', 'calculated', 'approved', 'paid'])->default('draft');
        $table->foreignId('generated_by')->nullable()->constrained('users')->onDelete('set null');
        $table->timestamps();

        $table->unique(['country_id', 'month', 'year']);
    });
}

public function down(): void
{
    Schema::dropIfExists('payroll_periods');
}
};
