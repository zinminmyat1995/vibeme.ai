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
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('currency_code', 10);
            $table->decimal('work_hours_per_day', 4, 2)->default(8);
            $table->integer('work_days_per_week')->default(5);
            $table->decimal('overtime_rate_weekday', 4, 2)->default(1.5);
            $table->decimal('overtime_rate_weekend', 4, 2)->default(2.0);
            $table->decimal('overtime_rate_holiday', 4, 2)->default(2.0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
