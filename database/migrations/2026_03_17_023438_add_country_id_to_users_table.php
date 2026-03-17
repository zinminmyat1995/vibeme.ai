<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('country_id')
                  ->nullable()
                  ->after('country')
                  ->constrained('countries')
                  ->onDelete('set null');
        });

        // Existing country string တွေကို country_id နဲ့ map လုပ်မယ်
        DB::statement("
            UPDATE users u
            JOIN countries c ON LOWER(c.name) = LOWER(u.country)
            SET u.country_id = c.id
            WHERE u.country IS NOT NULL
        ");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropColumn('country_id');
        });
    }
};