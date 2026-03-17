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
    Schema::create('leave_balances', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->enum('leave_type', ['annual', 'medical', 'emergency', 'unpaid', 'maternity', 'paternity']);
        $table->integer('year');
        $table->decimal('entitled_days', 4, 1)->default(0);
        $table->decimal('used_days', 4, 1)->default(0);
        $table->decimal('remaining_days', 4, 1)->default(0);
        $table->timestamps();

        $table->unique(['user_id', 'leave_type', 'year']);
    });
}

public function down(): void
{
    Schema::dropIfExists('leave_balances');
}
};
