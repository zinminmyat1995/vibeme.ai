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
        Schema::table('salary_deductions', function (Blueprint $table) {
            $table->foreignId('country_id')
                ->nullable()
                ->after('id')
                ->constrained('countries')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('salary_deductions', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropColumn('country_id');
        });
    }
};
