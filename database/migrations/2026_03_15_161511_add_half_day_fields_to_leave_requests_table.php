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
    Schema::table('leave_requests', function (Blueprint $table) {
        $table->enum('day_type', ['full_day', 'half_day_am', 'half_day_pm'])
              ->default('full_day')
              ->after('total_days');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            //
        });
    }
};
