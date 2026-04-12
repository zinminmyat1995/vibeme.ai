<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            // ── who receives it ──
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // ── notification type (leave_request, overtime_request, etc.) ──
            $table->string('type', 60);       // 'leave_request' | 'overtime_request' | 'payroll' ...

            // ── title + body ──
            $table->string('title', 200);
            $table->string('body',  500);

            // ── optional link (e.g. /payroll/leaves) ──
            $table->string('url', 500)->nullable();

            // ── optional extra JSON data (e.g. { request_id: 5 }) ──
            $table->json('data')->nullable();

            // ── read status ──
            $table->timestamp('read_at')->nullable();  // null = unread

            $table->timestamps();

            // ── indexes ──
            $table->index(['user_id', 'read_at']);     // fast unread count
            $table->index(['user_id', 'created_at']);  // fast listing
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};