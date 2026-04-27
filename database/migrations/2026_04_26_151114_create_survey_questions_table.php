<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained('surveys')->onDelete('cascade');

            $table->unsignedSmallInteger('order')->default(0);
            $table->text('question');

            // Question types
            $table->enum('type', [
                'single_choice',  // radio — တစ်ခုပဲ
                'multi_choice',   // checkbox — များများ
                'text',           // free text
                'rating',         // 1-5 stars
                'yes_no',         // Yes / No only
            ]);

            // For choice types — JSON array of strings
            $table->json('options')->nullable();

            // Required or optional
            $table->boolean('is_required')->default(true);

            // Conditional logic — show this question only if...
            $table->foreignId('depends_on_question_id')
                  ->nullable()
                  ->constrained('survey_questions')
                  ->onDelete('set null');

            // The answer value that triggers showing this question
            // e.g. "Yes", "Option A", "1"
            $table->string('depends_on_answer')->nullable();

            $table->timestamps();

            $table->index(['survey_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_questions');
    }
};