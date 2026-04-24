<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Chat messages (persist across sessions/devices) ──
        Schema::create('hr_chatbot_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['user', 'assistant']);
            $table->text('content');
            $table->boolean('from_cache')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        // ── Cache table (question hash → answer, per user) ──
        Schema::create('hr_chatbot_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('question_hash', 64); // SHA-256 of normalized question
            $table->text('question');            // original for debugging
            $table->text('answer');
            $table->timestamp('expires_at')->nullable(); // NULL = never expires
            $table->timestamps();

            $table->unique(['user_id', 'question_hash']);
            $table->index(['user_id', 'question_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_chatbot_cache');
        Schema::dropIfExists('hr_chatbot_messages');
    }
};