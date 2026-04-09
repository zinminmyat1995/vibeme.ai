<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\BlockedUser;
use App\Models\MessageRead;
use App\Models\MessageReaction;
use App\Models\MessageTranslation;
use App\Models\User;
use App\Events\ConversationCreated;
use App\Events\ConversationDeleted;
use App\Events\MemberAdded;
use App\Events\MemberRemoved;
use App\Events\GroupUpdated;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConversationController extends Controller
{
    // ── List all conversations for current user ──
    public function index()
    {
        $user = auth()->user();

        $conversations = Conversation::whereHas('members', fn($q) =>
                $q->where('user_id', $user->id)
            )
            ->with([
                'lastMessage.sender',
                'members.user',
            ])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn($c) => $this->formatConversation($c, $user->id));

        $users = User::where('id', '!=', $user->id)
            ->select('id', 'name', 'email', 'avatar_url')
            ->get();

        return Inertia::render('AiChat', [
            'conversations' => $conversations,
            'users'         => $users,
            'authUser'      => $user,
            'userId'        => $user->id,
        ]);
    }

    // ── Create private conversation ──
    public function createPrivate(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        $authId   = auth()->id();
        $targetId = $request->user_id;

        // Already exists?
        $existing = Conversation::where('type', 'private')
            ->whereHas('members', fn($q) => $q->where('user_id', $authId))
            ->whereHas('members', fn($q) => $q->where('user_id', $targetId))
            ->first();

        if ($existing) {
            return response()->json(['conversation' => $this->formatConversation($existing, $authId)]);
        }

        $conv = Conversation::create([
            'type'       => 'private',
            'created_by' => $authId,
        ]);

        $conv->members()->createMany([
            ['user_id' => $authId,   'role' => 'admin'],
            ['user_id' => $targetId, 'role' => 'member'],
        ]);

        $formatted = $this->formatConversation($conv->fresh(['members.user', 'lastMessage']), $authId);

        // ✅ Broadcast to target user so their sidebar updates in real-time
        $targetFormatted = $this->formatConversation($conv->fresh(['members.user', 'lastMessage']), $targetId);
        broadcast(new ConversationCreated($targetFormatted, $targetId));

        return response()->json(['conversation' => $formatted]);
    }

    // ── Create group conversation ──
    public function createGroup(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'user_ids'   => 'required|array|min:2',
            'user_ids.*' => 'exists:users,id',
        ]);

        $authId = auth()->id();

        $conv = Conversation::create([
            'type'       => 'group',
            'name'       => $request->name,
            'created_by' => $authId,
        ]);

        // Add creator as admin
        $members = [['user_id' => $authId, 'role' => 'admin']];
        foreach ($request->user_ids as $uid) {
            if ($uid != $authId) {
                $members[] = ['user_id' => $uid, 'role' => 'member'];
            }
        }
        $conv->members()->createMany($members);

        $freshConv = $conv->fresh(['members.user', 'lastMessage']);
        $formatted = $this->formatConversation($freshConv, $authId);

        // ✅ Broadcast to all other members
        foreach ($request->user_ids as $uid) {
            if ($uid != $authId) {
                $memberFormatted = $this->formatConversation($freshConv, $uid);
                broadcast(new ConversationCreated($memberFormatted, $uid));
            }
        }

        return response()->json(['conversation' => $formatted]);
    }

    // ── Mute / Unmute ──
    public function toggleMute(Conversation $conversation)
    {
        $member = $conversation->members()->where('user_id', auth()->id())->firstOrFail();
        $member->update(['is_muted' => !$member->is_muted]);
        return response()->json(['is_muted' => $member->is_muted]);
    }

    // ── Archive ──
    public function toggleArchive(Conversation $conversation)
    {
        $member = $conversation->members()->where('user_id', auth()->id())->firstOrFail();
        $member->update(['is_archived' => !$member->is_archived]);
        return response()->json(['is_archived' => $member->is_archived]);
    }

    // ── Delete conversation — hard delete with full cascade ──
    public function destroy(Conversation $conversation)
    {
        // Authorize: must be a member
        abort_unless(
            $conversation->members()->where('user_id', auth()->id())->exists(),
            403
        );

        $convId      = $conversation->id;
        $authId      = auth()->id();

        // ── Get all member IDs BEFORE deleting (for broadcast) ──
        $memberIds = $conversation->members()->pluck('user_id')->toArray();

        // 1. Get all message IDs (incl. soft-deleted)
        $messageIds = $conversation->messages()->withTrashed()->pluck('id');

        // 2. Delete message reads
        MessageRead::whereIn('message_id', $messageIds)->delete();

        // 3. Delete message reactions
        MessageReaction::whereIn('message_id', $messageIds)->delete();

        // 4. Delete message translations
        MessageTranslation::whereIn('message_id', $messageIds)->delete();

        // 5. Delete physical storage files
        $filePaths = $conversation->messages()->withTrashed()
            ->whereNotNull('file_path')
            ->pluck('file_path');
        foreach ($filePaths as $path) {
            Storage::disk('public')->delete($path);
        }

        // 6. Hard delete all messages
        $conversation->messages()->withTrashed()->forceDelete();

        // 7. Delete conversation members
        $conversation->members()->delete();

        // 8. Delete the conversation itself
        $conversation->delete();

        // 9. Broadcast to all members so their sidebar updates in real-time
        foreach ($memberIds as $memberId) {
            if ($memberId !== $authId) {
                broadcast(new ConversationDeleted($convId, $memberId));
            }
        }

        return response()->json(['success' => true]);
    }



    // ── Update group name / avatar ──
    public function updateGroup(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->type === 'group', 403);

        // Only admin can edit group info
        $myRole = $conversation->members()->where('user_id', auth()->id())->value('role');
        abort_unless($myRole === 'admin', 403, 'Only admins can edit group info.');

        $request->validate([
            'name'   => 'nullable|string|max:100',
            'avatar' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('avatar')) {
            // Delete old avatar file if exists
            if ($conversation->avatar) {
                Storage::disk('public')->delete($conversation->avatar);
            }
            $path = $request->file('avatar')->store('group-avatars', 'public');
            $conversation->avatar = $path;
        }

        if ($request->filled('name')) {
            $conversation->name = $request->name;
        }

        $conversation->save();

        $avatarUrl = $conversation->avatar
            ? Storage::disk('public')->url($conversation->avatar)
            : null;

        // Broadcast to all members in the conversation channel
        broadcast(new GroupUpdated(
            $conversation->id,
            $conversation->name,
            $conversation->avatar,
            $avatarUrl
        ));

        return response()->json([
            'success'    => true,
            'name'       => $conversation->name,
            'avatar'     => $conversation->avatar,
            'avatar_url' => $avatarUrl,
        ]);
    }

    // ── Add member to group ──

    public function addMember(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->type === 'group', 403);

        $myRole = $conversation->members()->where('user_id', auth()->id())->value('role');
        abort_unless($myRole === 'admin', 403, 'Only admins can add members.');

        $request->validate(['user_id' => 'required|exists:users,id']);

        if ($conversation->members()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Already a member'], 422);
        }

        $conversation->members()->create([
            'user_id' => $request->user_id,
            'role'    => 'member',
        ]);

        $user = User::find($request->user_id);

        $memberData = [
            'id'         => $user->id,
            'name'       => $user->name,
            'avatar_url' => $user->avatar_url ?? null,
            'role'       => 'member',
        ];

        // Broadcast new conversation to the added user (so their sidebar updates)
        $convForNewMember = $this->formatConversation(
            $conversation->fresh(['members.user', 'lastMessage']),
            $user->id
        );
        broadcast(new ConversationCreated($convForNewMember, $user->id));

        // Broadcast member added to all existing members (so their panel updates)
        broadcast(new MemberAdded($conversation->id, $memberData));

        return response()->json([
            'success' => true,
            'member'  => $memberData,
        ]);
    }

    // ── Remove member from group (or leave) ──
    public function removeMember(Request $request, Conversation $conversation, int $userId)
    {
        abort_unless($conversation->type === 'group', 403);

        $authId = auth()->id();
        $myRole = $conversation->members()->where('user_id', $authId)->value('role');

        if ($userId !== $authId) {
            abort_unless($myRole === 'admin', 403, 'Only admins can remove members.');
        }

        if ($conversation->members()->where('user_id', $userId)->value('role') === 'admin') {
            $adminCount = $conversation->members()->where('role', 'admin')->count();
            abort_unless($adminCount > 1, 422, 'Cannot remove the only admin.');
        }

        $conversation->members()->where('user_id', $userId)->delete();

        // Broadcast to removed user → their sidebar removes this conversation
        broadcast(new ConversationDeleted($conversation->id, $userId));

        // Broadcast to remaining members → their member panel updates
        broadcast(new MemberRemoved($conversation->id, $userId));

        return response()->json(['success' => true]);
    }

    // ── Block user ──
    public function blockUser(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        BlockedUser::firstOrCreate([
            'user_id'         => auth()->id(),
            'blocked_user_id' => $request->user_id,
        ]);

        // Find the private conversation between these two users
        $conv = Conversation::where('type', 'private')
            ->whereHas('members', fn($q) => $q->where('user_id', auth()->id()))
            ->whereHas('members', fn($q) => $q->where('user_id', $request->user_id))
            ->first();

        if ($conv) {
            broadcast(new \App\Events\UserBlocked($conv->id, $request->user_id, true));
        }

        return response()->json(['success' => true, 'i_blocked_them' => true, 'they_blocked_me' => false]);
    }

    public function unblockUser(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        BlockedUser::where('user_id', auth()->id())
            ->where('blocked_user_id', $request->user_id)
            ->delete();

        $conv = Conversation::where('type', 'private')
            ->whereHas('members', fn($q) => $q->where('user_id', auth()->id()))
            ->whereHas('members', fn($q) => $q->where('user_id', $request->user_id))
            ->first();

        if ($conv) {
            broadcast(new \App\Events\UserBlocked($conv->id, $request->user_id, false));
        }

        return response()->json(['success' => true, 'i_blocked_them' => false, 'they_blocked_me' => false]);
    }

    // ── Format helper ──
    private function formatConversation(Conversation $c, int $authId): array
    {
        $other = null;
        $iBlockedThem   = false;
        $theyBlockedMe  = false;

        if ($c->type === 'private') {
            $other = $c->members->firstWhere('user_id', '!=', $authId)?->user;
            if ($other) {
                $iBlockedThem  = BlockedUser::where('user_id', $authId)
                    ->where('blocked_user_id', $other->id)->exists();
                $theyBlockedMe = BlockedUser::where('user_id', $other->id)
                    ->where('blocked_user_id', $authId)->exists();
            }
        }

        return [
            'id'               => $c->id,
            'type'             => $c->type,
            'name'             => $c->type === 'group' ? $c->name : $other?->name,
            'avatar_url'       => $c->type === 'group' ? $c->avatar : $other?->avatar_url,
            'i_blocked_them'   => $iBlockedThem,
            'they_blocked_me'  => $theyBlockedMe,
            'members'          => $c->members->map(fn($m) => [
                'id'        => $m->user->id,
                'name'      => $m->user->name,
                'avatar_url'=> $m->user->avatar_url ?? null,
                'role'      => $m->role,
                'is_muted'  => $m->is_muted,
            ]),
            'last_message'     => $c->lastMessage ? [
                'id'         => $c->lastMessage->id,
                'body'       => $c->lastMessage->body,
                'type'       => $c->lastMessage->type,
                'sender_id'  => $c->lastMessage->sender_id,
                'created_at' => $c->lastMessage->created_at->toISOString(), // ✅ UTC ISO → frontend converts to local time
            ] : null,
            'unread_count'     => $c->unreadCount($authId),
            'last_message_at'  => $c->last_message_at?->toISOString(), // ✅ UTC ISO
        ];
    }
}