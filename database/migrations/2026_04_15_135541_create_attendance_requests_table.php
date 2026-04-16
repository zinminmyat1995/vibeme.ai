<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();

            $table->date('date');

            $table->time('requested_check_in_time')->nullable();
            $table->time('requested_check_out_time')->nullable();

            $table->time('approved_check_in_time')->nullable();
            $table->time('approved_check_out_time')->nullable();

            $table->decimal('requested_work_hours', 6, 2)->nullable();
            $table->integer('requested_late_minutes')->default(0);

            $table->decimal('approved_work_hours', 6, 2)->nullable();
            $table->integer('approved_late_minutes')->default(0);
            $table->decimal('approved_short_hours', 6, 2)->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->text('note');
            $table->text('rejection_reason')->nullable();

            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['user_id', 'date']);
            $table->index(['approver_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_requests');
    }
};