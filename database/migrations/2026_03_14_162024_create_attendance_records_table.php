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
    Schema::create('attendance_records', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->date('date');
        $table->enum('status', ['present', 'absent', 'half_day', 'late'])->default('present');
        $table->time('check_in_time')->nullable();
        $table->time('check_out_time')->nullable();
        $table->decimal('work_hours_actual', 4, 2)->default(0);
        $table->integer('late_minutes')->default(0);
        $table->text('note')->nullable();
        $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
        $table->timestamps();

        $table->unique(['user_id', 'date']);
    });
}

public function down(): void
{
    Schema::dropIfExists('attendance_records');
}
};
