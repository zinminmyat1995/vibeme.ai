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
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->enum('trip_type', [
                'one_way',
                'round_trip', 
                'multi_stop',
                'wait_return',
                'pickup',
            ])->nullable()->after('purpose');

            $table->string('pickup_location')->nullable()->after('trip_type');

            $table->enum('driver_status', [
                'pending',
                'on_the_way',
                'completed',
            ])->default('pending')->after('pickup_location');

            $table->text('driver_note')->nullable()->after('driver_status');
        });
    }

    public function down(): void
    {
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->dropColumn(['trip_type', 'pickup_location', 'driver_status', 'driver_note']);
        });
    }
};
