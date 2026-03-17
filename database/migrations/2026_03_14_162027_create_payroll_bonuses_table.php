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
    Schema::create('payroll_bonuses', function (Blueprint $table) {
        $table->id();
        $table->foreignId('payroll_record_id')->constrained('payroll_records')->onDelete('cascade');
        $table->enum('bonus_type', ['performance', 'festival', 'annual', 'other']);
        $table->decimal('amount', 15, 2);
        $table->text('note')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('payroll_bonuses');
}
};
