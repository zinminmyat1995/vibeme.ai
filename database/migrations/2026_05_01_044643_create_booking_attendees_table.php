<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_attendees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                  ->constrained('resource_bookings')
                  ->onDelete('cascade');

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->timestamps();

            // တစ်ယောက်တည်း တစ်ခါထက်မပိုထည့်မိအောင်
            $table->unique(['booking_id', 'user_id']);

            $table->index(['user_id']); // My Invitations query အတွက်
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_attendees');
    }
};