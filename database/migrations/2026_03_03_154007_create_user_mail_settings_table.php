<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_mail_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Provider
            $table->string('provider')->default('other'); // gmail, outlook, yahoo, other
            $table->string('mail_name');                  // Display name
            $table->string('mail_address');               // user@gmail.com

            // SMTP (Send)
            $table->string('smtp_host');                  // smtp.gmail.com
            $table->integer('smtp_port')->default(587);
            $table->string('smtp_encryption')->default('tls'); // tls, ssl

            // IMAP (Receive)
            $table->string('imap_host');                  // imap.gmail.com
            $table->integer('imap_port')->default(993);

            // Password — AES-256 encrypted
            $table->text('mail_password');

            // Status
            $table->boolean('is_verified')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->string('sync_status')->default('idle'); // idle, syncing, failed
            $table->text('sync_error')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_mail_settings');
    }
};