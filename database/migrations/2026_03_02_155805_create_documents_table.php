<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('folder_id')->nullable()->constrained()->onDelete('set null');
            $table->string('original_filename');
            $table->string('storage_path');     // storage/app/public/documents/
            $table->string('file_type');        // pdf, docx, txt, image
            $table->bigInteger('file_size');    // bytes
            $table->integer('page_count')->default(0);
            $table->string('source_language')->default('en'); // en,ja,my,km,vi,ko
            $table->json('target_languages')->nullable();     // ["ja","km","my"]
            $table->json('translated_paths')->nullable();     // {"ja":"path","km":"path"}
            $table->enum('status', ['pending','translating','completed','failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->json('tags')->nullable();               // ["hr","report","2026"]
            $table->enum('visibility', ['private', 'branch', 'all'])->default('all');
            $table->string('branch')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};