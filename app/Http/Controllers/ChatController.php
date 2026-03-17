<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class ChatController extends Controller
{
    public function index()
    {
        // ConversationController::index() ကို redirect
        return app(ConversationController::class)->index();
    }
}