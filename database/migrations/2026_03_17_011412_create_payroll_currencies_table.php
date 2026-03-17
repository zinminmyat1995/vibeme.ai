<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_currencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->string('currency_name');        // e.g. US Dollar
            $table->string('currency_code', 10);    // e.g. USD
            $table->string('symbol', 10);           // e.g. $, ៛, K
            $table->tinyInteger('decimal_places')->default(2); // 0 for KHR, 2 for USD
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_currencies');
    }
};