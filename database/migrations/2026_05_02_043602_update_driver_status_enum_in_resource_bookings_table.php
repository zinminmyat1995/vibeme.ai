<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
public function up(): void
{
    // Step 1 — Enum ကို အရင် old + new values အကုန်ထည့်ပြီး expand လုပ်
    DB::statement("ALTER TABLE resource_bookings MODIFY COLUMN driver_status ENUM('pending','on_the_way','completed','start','returned','ended') DEFAULT 'pending'");

    // Step 2 — Data တွေ migrate
    DB::statement("UPDATE resource_bookings SET driver_status = 'start' WHERE driver_status = 'pending'");
    DB::statement("UPDATE resource_bookings SET driver_status = 'ended' WHERE driver_status = 'completed'");

    // Step 3 — Old values ဖြုတ်ပြီး final enum သတ်မှတ်
    DB::statement("ALTER TABLE resource_bookings MODIFY COLUMN driver_status ENUM('start','on_the_way','returned','ended') DEFAULT 'start'");
}
};