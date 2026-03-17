<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Mail Identity
            $table->string('mail_uid')->nullable();  // IMAP UID
            $table->enum('type', ['sent','received','draft']);

            // Addresses
            $table->string('from_address');
            $table->string('from_name')->nullable();
            $table->json('to_addresses');             // ["a@gmail.com"]
            $table->json('cc_addresses')->nullable();
            $table->json('bcc_addresses')->nullable();

            // Content
            $table->string('subject')->nullable();
            $table->longText('body_html')->nullable();
            $table->longText('body_text')->nullable();

            // AI / Translation
            $table->json('translated_body')->nullable(); // {"km":"...","ja":"..."}
            $table->string('detected_language')->nullable();
            $table->boolean('ai_generated')->default(false);
            $table->string('template_used')->nullable();

            // Status flags
            $table->boolean('is_read')->default(false);
            $table->boolean('is_starred')->default(false);
            $table->softDeletes();

            // Actual mail datetime
            $table->timestamp('mail_date')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mails');
    }
};