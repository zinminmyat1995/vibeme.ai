<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // GET /notifications — list + unread count
    public function index(): JsonResponse
    {
        $userId = Auth::id();

        $items = Notification::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'body'       => $n->body,
                'url'        => $n->url,
                'data'       => $n->data,
                'read_at'    => $n->read_at?->toISOString(),
                'created_at' => $n->created_at?->toISOString(),
            ]);

        $unread = Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $items,
            'unread_count'  => $unread,
        ]);
    }

    // PATCH /notifications/{id}/read — mark single as read
    public function markRead(Notification $notification): JsonResponse
    {
        // Only the owner can mark
        abort_if($notification->user_id !== Auth::id(), 403);

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json(['success' => true]);
    }

    // PATCH /notifications/read-all — mark all unread as read
    public function markAllRead(): JsonResponse
    {
        Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}