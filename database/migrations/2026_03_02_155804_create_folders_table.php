<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('folders')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('visibility', ['private', 'branch', 'all'])->default('all');
            $table->string('branch')->nullable(); // KH, MM, JP, VN, KR
            $table->integer('depth')->default(1);  // max 3
            $table->string('color', 7)->default('#7c3aed'); // folder color
            $table->string('icon')->default('📁');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('folders');
    }
};