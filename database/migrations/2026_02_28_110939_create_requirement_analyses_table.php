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
        Schema::create('requirement_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('project_title');
            $table->text('project_description');
            $table->json('core_features')->nullable();
            $table->enum('platform', ['web','mobile','both','desktop'])->default('web');
            $table->integer('expected_users')->default(0);
            $table->text('integration_needs')->nullable();
            $table->string('budget_range')->nullable();
            $table->date('expected_deadline')->nullable();
            $table->text('special_requirements')->nullable();
            $table->enum('status', ['pending','analyzing','completed','failed'])->default('pending');
            $table->json('ai_analysis')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requirement_analyses');
    }
};
