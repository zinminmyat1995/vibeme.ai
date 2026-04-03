<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')
                  ->constrained('job_applications')
                  ->onDelete('cascade');

            // ── Schedule ──
            $table->dateTime('scheduled_at');
            $table->enum('type', ['online', 'onsite'])->default('online');
            $table->enum('platform', ['zoom', 'google_meet', 'teams', 'physical', 'other'])
                  ->nullable();
            $table->string('meeting_link')->nullable();
            $table->string('location')->nullable();
            $table->string('interviewer_name')->nullable();
            $table->text('note_to_candidate')->nullable();

            // ── Post-interview Score (HR fills after interview) ──
            $table->unsignedTinyInteger('score')->nullable();        // 0–100
            $table->text('strengths')->nullable();
            $table->text('weaknesses')->nullable();
            $table->enum('recommendation', ['proceed', 'hold', 'reject'])->nullable();
            $table->text('internal_note')->nullable();

            // ── Meta ──
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_interviews');
    }
};