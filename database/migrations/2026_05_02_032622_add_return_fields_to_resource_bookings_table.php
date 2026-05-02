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
            $table->boolean('has_return')->default(false)->after('driver_note');
            $table->time('return_time')->nullable()->after('has_return');
        });
    }

    public function down(): void
    {
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->dropColumn(['has_return', 'return_time']);
        });
    }
};
