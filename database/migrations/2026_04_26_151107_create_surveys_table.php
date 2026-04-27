<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->nullable()->constrained('countries')->onDelete('set null');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');

            $table->string('title');
            $table->text('description')->nullable();

            // Status: draft → active → closed
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');

            // Anonymous responses
            $table->boolean('is_anonymous')->default(false);

            // Secure public URL token
            $table->string('token', 64)->unique();

            // Deadline
            $table->timestamp('closes_at')->nullable();

            // AI insight cache
            $table->text('ai_insight')->nullable();
            $table->timestamp('ai_insight_generated_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'country_id']);
            $table->index('token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surveys');
    }
};