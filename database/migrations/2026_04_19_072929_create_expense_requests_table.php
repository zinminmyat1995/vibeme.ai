<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_requests', function (Blueprint $table) {
            $table->id();

            // ── Who submitted ──
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // ── Who approves (HR) ──
            $table->foreignId('approver_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            // ── Expense details ──
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('USD');

            $table->enum('category', [
                'transport',
                'meal',
                'accommodation',
                'equipment',
                'medical',
                'training',
                'communication',
                'other',
            ])->default('other');

            $table->date('expense_date');

            // ── Document/Receipt uploads (JSON array of paths) ──
            $table->json('attachments')->nullable();
            // stores: [{"name":"receipt.jpg","path":"expenses/...","size":"120KB","type":"image/jpeg"}]

            // ── Status ──
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
            ])->default('pending');

            // ── Approval info ──
            $table->foreignId('approved_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // ── Payroll linkage (ဘယ် period မှာ reimburse လုပ်မလဲ) ──
            $table->foreignId('payroll_period_id')
                  ->nullable()
                  ->constrained('payroll_periods')
                  ->onDelete('set null');
            $table->timestamp('reimbursed_at')->nullable();

            // ── Note from HR ──
            $table->text('hr_note')->nullable();

            $table->timestamps();

            // ── Indexes ──
            $table->index(['user_id', 'status']);
            $table->index(['approver_id', 'status']);
            $table->index(['payroll_period_id']);
            $table->index('expense_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_requests');
    }
};