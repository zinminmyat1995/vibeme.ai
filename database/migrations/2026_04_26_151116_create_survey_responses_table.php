<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained('surveys')->onDelete('cascade');

            // Named: user_id ထည့်, Anonymous: null
            $table->foreignId('respondent_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            // Unique token per submission — duplicate prevention
            $table->string('respondent_token', 64)->unique();

            // All answers: { "question_id": "answer" or ["a","b"] }
            $table->json('answers');

            // Security
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();

            // Timing
            $table->unsignedSmallInteger('completion_seconds')->nullable();
            $table->timestamp('submitted_at')->useCurrent();

            $table->timestamps();

            $table->index(['survey_id', 'submitted_at']);
            $table->index(['survey_id', 'respondent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
    }
};