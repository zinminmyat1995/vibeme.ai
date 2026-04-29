<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_bookings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('resource_id')
                  ->constrained('bookable_resources')
                  ->onDelete('cascade');

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->date('booking_date');
            $table->time('start_time');
            $table->time('end_time')->nullable(); // Car မှာ return time မသိရင် null

            $table->string('purpose');

            // open_ended = car ငှားပြီး ပြန်လာချိန် မသိသေးဘူး
            $table->boolean('is_open_ended')->default(false);

            // Driver က "ပြန်ရောက်ပြီ" နှိပ်တဲ့အချိန် (နောက်မှ Driver feature ထည့်ရင် သုံးမယ်)
            $table->timestamp('returned_at')->nullable();

            $table->enum('status', [
                'pending',    // HR မ approve သေးဘူး
                'approved',   // HR approve ပြီး
                'rejected',   // HR reject ပြီး
                'cancelled',  // User ကိုယ်တိုင် cancel
                'waitlisted', // Car open-ended ဖြစ်နေလို့ queue ထဲစောင့်နေ
                'completed',  // Trip ပြီးဆုံးပြီ
            ])->default('pending');

            $table->text('reject_reason')->nullable();

            $table->foreignId('approved_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            $table->index(['resource_id', 'booking_date', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['resource_id', 'status', 'is_open_ended']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_bookings');
    }
};