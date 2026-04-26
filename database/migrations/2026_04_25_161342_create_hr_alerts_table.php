<?php
// database/migrations/xxxx_create_hr_alerts_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // alert type: 'late' or 'absent'
            $table->enum('type', ['late', 'absent']);

            // how many times/days triggered
            $table->unsignedTinyInteger('trigger_count');

            // AI generated warning letter draft
            $table->text('letter_draft')->nullable();

            // HR action
            $table->enum('status', ['pending', 'sent', 'dismissed'])->default('pending');

            // who sent / dismissed
            $table->foreignId('actioned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('actioned_at')->nullable();

            // prevent duplicate alerts for same month
            $table->unsignedTinyInteger('alert_month');
            $table->unsignedSmallInteger('alert_year');

            $table->timestamps();

            // one alert per user per type per month
            $table->unique(['user_id', 'type', 'alert_month', 'alert_year'], 'hr_alerts_unique');
            $table->index(['country_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_alerts');
    }
};