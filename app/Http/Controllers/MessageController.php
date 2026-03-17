<?php

namespace App\Http\Controllers;

use App\Events\MessageDeleted;
use App\Events\MessageEdited;
use App\Events\MessageReacted;
use App\Events\MessageSent;
use App\Events\MessageRead as MessageReadEvent;
use App\Events\UserTyping;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\MessageRead;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    public function __construct(private AiService $aiService) {}

    // ── Get messages for a conversation ──
    public function index(Conversation $conversation)
    {
        $this->authorizeMember($conversation);

        $messages = $conversation->messages()
            ->with(['sender', 'replyTo.sender', 'reactions.user', 'reads'])
            ->whereNull('deleted_at')
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => $this->formatMessage($m));

        return response()->json(['messages' => $messages]);
    }

    // ── Send message ──
    public function store(Request $request, Conversation $conversation)
    {
        $this->authorizeMember($conversation);

        $request->validate([
            'type'        => 'required|in:text,image,video,audio,file,sticker',
            'body'        => 'nullable|string|max:5000',
            'file'        => 'nullable|file|max:51200', // 50MB
            'reply_to_id' => 'nullable|exists:messages,id',
        ]);

        $filePath = $fileName = $fileSize = $mimeType = null;

        if ($request->hasFile('file')) {
            $file      = $request->file('file');
            $folder    = match($request->type) {
                'image' => 'chat/images',
                'video' => 'chat/videos',
                'audio' => 'chat/audio',
                default => 'chat/files',
            };
            $filePath  = $file->store($folder, 'public');
            $fileName  = $file->getClientOriginalName();
            $fileSize  = $file->getSize();
            $mimeType  = $file->getMimeType();
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => auth()->id(),
            'type'            => $request->type,
            'body'            => $request->body,
            'file_path'       => $filePath,
            'file_name'       => $fileName,
            'file_size'       => $fileSize,
            'mime_type'       => $mimeType,
            'reply_to_id'     => $request->reply_to_id,
        ]);

        // Update conversation last_message_at
        $conversation->update(['last_message_at' => now()]);

        $message->load(['sender', 'replyTo.sender', 'reactions', 'reads']);

        broadcast(new MessageSent($message));

        return response()->json([
            'success' => true,
            'message' => $this->formatMessage($message),
        ]);
    }

    // ── Edit message ──
    public function update(Request $request, Message $message)
    {
        abort_if($message->sender_id !== auth()->id(), 403);
        $request->validate(['body' => 'required|string|max:5000']);

        $message->update([
            'body'      => $request->body,
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        broadcast(new MessageEdited($message))->toOthers();

        return response()->json(['success' => true, 'message' => $this->formatMessage($message)]);
    }

    // ── Delete message ──
    public function destroy(Message $message)
    {
        abort_if($message->sender_id !== auth()->id(), 403);

        $conversationId = $message->conversation_id;
        $messageId      = $message->id;

        $message->delete(); // soft delete

        broadcast(new MessageDeleted($messageId, $conversationId))->toOthers();

        return response()->json(['success' => true]);
    }

    // ── React to message — 1 acc = 1 react ──
    public function react(Request $request, Message $message)
    {
        $request->validate(['emoji' => 'required|string|max:10']);

        $conv   = $message->conversation;
        $userId = auth()->id();
        $emoji  = $request->emoji;

        $existing = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->emoji === $emoji) {
                // ✅ Same emoji → remove
                // $existing ကို delete မလုပ်ခင် user load လုပ်ထားရမယ် (broadcastWith မှာ user_name လိုတယ်)
                $existing->load('user');
                $existing->delete();
                broadcast(new MessageReacted($existing, $conv->id, true));
                return response()->json(['success' => true, 'action' => 'removed']);
            } else {
                // ✅ Different emoji → switch
                $oldEmoji = $existing->emoji;
                $existing->load('user');
                $existing->delete();

                $reaction = MessageReaction::create([
                    'message_id' => $message->id,
                    'user_id'    => $userId,
                    'emoji'      => $emoji,
                ]);
                $reaction->load('user');
                broadcast(new MessageReacted($reaction, $conv->id, false, $oldEmoji));
                return response()->json(['success' => true, 'action' => 'switched']);
            }
        }

        // ✅ New reaction
        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id'    => $userId,
            'emoji'      => $emoji,
        ]);
        $reaction->load('user');
        broadcast(new MessageReacted($reaction, $conv->id, false));

        return response()->json(['success' => true, 'action' => 'added']);
    }

    
    // ── Mark messages as read ──
    public function markRead(Conversation $conversation)
    {
        $this->authorizeMember($conversation);
        $userId = auth()->id();

        // Get unread message IDs
        $unreadIds = $conversation->messages()
            ->where('sender_id', '!=', $userId)
            ->whereDoesntHave('reads', fn($q) => $q->where('user_id', $userId))
            ->pluck('id');

        foreach ($unreadIds as $msgId) {
            MessageRead::firstOrCreate([
                'message_id' => $msgId,
                'user_id'    => $userId,
            ], ['read_at' => now()]);
        }

        // Update last_read_at
        $conversation->members()
            ->where('user_id', $userId)
            ->update(['last_read_at' => now()]);

        broadcast(new MessageReadEvent($conversation->id, $userId, now()->toISOString()))->toOthers();

        return response()->json(['success' => true]);
    }

    // ── Typing indicator ──
    public function typing(Request $request, Conversation $conversation)
    {
        $this->authorizeMember($conversation);

        broadcast(new UserTyping(
            $conversation->id,
            auth()->user(),
            $request->boolean('is_typing')
        ))->toOthers(); 

        return response()->json(['success' => true]);
    }

    // ── Translate message ──
    public function translate(Request $request, Message $message)
    {
        $request->validate(['language' => 'required|in:en,ja,my,km,vi,ko']);
        $lang = $request->language;

        $existing = $message->getTranslation($lang);
        if ($existing) {
            return response()->json(['success' => true, 'translated' => $existing, 'cached' => true]);
        }

        $translated = $this->aiService->translate($message->body ?? '', $lang);

        $message->translations()->updateOrCreate(
            ['language' => $lang],
            ['translated' => $translated]
        );

        return response()->json(['success' => true, 'translated' => $translated]);
    }

    // ── Media gallery ──
    public function media(Conversation $conversation)
    {
        $this->authorizeMember($conversation);

        $media = $conversation->messages()
            ->whereIn('type', ['image', 'video', 'file', 'audio'])
            ->whereNull('deleted_at')
            ->with('sender')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($m) => [
                'id'        => $m->id,
                'type'      => $m->type,
                'file_url'  => $m->file_url,
                'file_name' => $m->file_name,
                'file_size' => $m->file_size,
                'sender'    => $m->sender->name,
                'created_at'=> $m->created_at->format('d M Y'),
            ]);

        return response()->json(['media' => $media]);
    }

    // ── Helpers ──
    private function authorizeMember(Conversation $conversation): void
    {
        abort_unless(
            $conversation->members()->where('user_id', auth()->id())->exists(),
            403
        );
    }

    private function formatMessage(Message $m): array
    {
        return [
            'id'              => $m->id,
            'conversation_id' => $m->conversation_id,
            'sender_id'       => $m->sender_id,
            'sender'          => [
                'id'     => $m->sender->id,
                'name'   => $m->sender->name,
                'avatar_url' => $m->sender->avatar_url ?? null,
            ],
            'type'       => $m->type,
            'body'       => $m->body,
            'file_path'  => $m->file_path,
            'file_name'  => $m->file_name,
            'file_size'  => $m->file_size,
            'mime_type'  => $m->mime_type,
            'file_url'   => $m->file_url,
            'reply_to'   => $m->replyTo ? [
                'id'          => $m->replyTo->id,
                'body'        => $m->replyTo->body,
                'type'        => $m->replyTo->type,
                'sender_name' => $m->replyTo->sender->name,
            ] : null,
            'reactions'  => $m->reactions->groupBy('emoji')->map(fn($r, $emoji) => [
                'emoji'         => $emoji,
                'count'         => $r->count(),
                'users'         => $r->pluck('user.name')->values()->toArray(), // ✅ fix
                'reacted_by_me' => $r->contains('user_id', auth()->id()),
            ])->values(),
            'reads'      => $m->reads->map(fn($r) => [
                'user_id' => $r->user_id,
                'read_at' => $r->read_at?->toISOString(), // ✅ fix
            ]),
            'is_edited'  => $m->is_edited,
            'edited_at'  => $m->edited_at?->toISOString(),
            'created_at' => $m->created_at->toISOString(),
            'status'     => 'sent',
        ];
    }
}