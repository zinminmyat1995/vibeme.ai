<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_currencies', function (Blueprint $table) {
            $table->dropColumn(['symbol', 'decimal_places', 'is_primary']);
        });
    }

    public function down(): void
    {
        Schema::table('payroll_currencies', function (Blueprint $table) {
            $table->string('symbol', 10)->nullable();
            $table->tinyInteger('decimal_places')->default(2);
            $table->boolean('is_primary')->default(false);
        });
    }
};