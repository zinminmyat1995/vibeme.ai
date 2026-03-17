<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_banks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->string('bank_name');
            $table->string('bank_code')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // country တစ်ခုမှာ bank name တူရင် မခံဘူး
            $table->unique(['country_id', 'bank_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_banks');
    }
};