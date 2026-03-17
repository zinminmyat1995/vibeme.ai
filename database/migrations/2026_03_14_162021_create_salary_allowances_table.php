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
        Schema::create('salary_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salary_rule_id')->constrained('salary_rules')->onDelete('cascade');
            $table->string('name'); // Transport, Housing, Meal...
            $table->decimal('amount', 15, 2)->default(0);
            $table->boolean('is_percentage')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_allowances');
    }
};
