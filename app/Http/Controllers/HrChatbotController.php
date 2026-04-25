<?php
namespace App\Http\Controllers;

use App\Services\HrChatbotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HrChatbotController extends Controller
{
    public function __construct(private HrChatbotService $chatbot) {}

    // GET /hr-chatbot/messages?before_id=&limit=10
    public function messages(Request $request)
    {
        $limit    = (int) $request->get('limit', 10);
        $beforeId = $request->get('before_id');
        $messages = $this->chatbot->getMessages(Auth::id(), $limit, $beforeId);
        $hasMore  = $this->chatbot->hasMoreMessages(Auth::id(), $beforeId, $limit);
        return response()->json(['messages' => $messages, 'has_more' => $hasMore]);
    }

    // POST /hr-chatbot/ask
    public function ask(Request $request)
    {
        $request->validate(['message' => 'required|string|max:1000']);
        $result = $this->chatbot->ask(Auth::user(), $request->input('message'));
        return response()->json(['reply' => $result['reply'], 'cached' => $result['cached'], 'success' => true]);
    }

    // DELETE /hr-chatbot/messages
    public function clear()
    {
        $this->chatbot->clearMessages(Auth::id());
        return response()->json(['success' => true]);
    }

    // GET /hr-chatbot/quick-actions
    public function quickActions()
    {
        $role = Auth::user()->role?->name;
        $actions = $this->chatbot->getQuickActions($role);
        return response()->json(['actions' => $actions]);
    }
}