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
    Schema::create('social_security_rules', function (Blueprint $table) {
        $table->id();
        $table->foreignId('salary_rule_id')->constrained('salary_rules')->onDelete('cascade');
        $table->decimal('employee_rate_percentage', 5, 2)->default(0);
        $table->decimal('employer_rate_percentage', 5, 2)->default(0);
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('social_security_rules');
}
};
