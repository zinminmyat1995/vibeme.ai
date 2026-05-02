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
    Schema::create('booking_stops', function (Blueprint $table) {
        $table->id();
        $table->foreignId('booking_id')
              ->constrained('resource_bookings')
              ->onDelete('cascade');
        $table->unsignedTinyInteger('order');  // 1, 2, 3...
        $table->string('location');
        $table->time('arrival_time')->nullable();
        $table->timestamps();

        $table->index(['booking_id', 'order']);
    });
}

public function down(): void
{
    Schema::dropIfExists('booking_stops');
}
};
