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
    Schema::create('leave_policies', function (Blueprint $table) {
        $table->id();
        $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
        $table->enum('leave_type', ['annual', 'medical', 'emergency', 'unpaid', 'maternity', 'paternity']);
        $table->integer('days_per_year')->default(0);
        $table->boolean('is_paid')->default(true);
        $table->integer('carry_over_days')->default(0);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('leave_policies');
}
};
