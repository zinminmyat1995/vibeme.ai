<?php

namespace App\Http\Controllers;

use App\Services\HrChatbotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HrChatbotController extends Controller
{
    public function __construct(private HrChatbotService $chatbot) {}

    // GET /hr-chatbot/messages
    // Load existing messages when chat opens
    public function messages()
    {
        $messages = $this->chatbot->getMessages(Auth::id());
        return response()->json(['messages' => $messages]);
    }

    // POST /hr-chatbot/ask
    // Send a message
    public function ask(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $result = $this->chatbot->ask(Auth::user(), $request->input('message'));

        return response()->json([
            'reply'   => $result['reply'],
            'cached'  => $result['cached'],
            'success' => true,
        ]);
    }

    // DELETE /hr-chatbot/messages
    // Clear chat history
    public function clear()
    {
        $this->chatbot->clearMessages(Auth::id());
        return response()->json(['success' => true]);
    }
}