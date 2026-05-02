<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_driver_notes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                  ->constrained('resource_bookings')
                  ->onDelete('cascade');

            $table->foreignId('driver_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // Trip summary (auto-fill) — date, time, purpose
            $table->date('trip_date');
            $table->time('trip_start_time');
            $table->time('trip_end_time')->nullable();
            $table->string('trip_purpose')->nullable();

            // Driver ရဲ့ note
            $table->text('note');

            $table->timestamps();

            $table->index(['booking_id']);
            $table->index(['driver_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_driver_notes');
    }
};