<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    /**
     * ✅ Liste des conversations avec compteur non-lus
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = $request->user()->conversations()
            ->wherePivot('is_archived', false)
            ->with([
                'participants:id,name,email,avatar_path,role',
                'messages' => fn ($q) => $q->latest()->limit(1),
            ])
            ->latest('conversations.updated_at')
            ->get();

        $conversations->each(function ($conv) use ($userId) {
            $lastReadAt = $conv->pivot->last_read_at ?? null;

            $conv->unread_count = \App\Models\Message::where('conversation_id', $conv->id)
                ->where('sender_id', '!=', $userId)
                ->when($lastReadAt, fn ($q) => $q->where('created_at', '>', $lastReadAt))
                ->count();

            $conv->is_group = $conv->participants->count() > 2 || !empty($conv->title);
            $conv->group_title = $conv->title;
        });

        return $conversations;
    }

    /**
     * ✅ Détails d'une conversation
     */
    public function show(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        return $conversation->load('participants:id,name,email,avatar_path,role');
    }

    /**
     * ✅ Créer une conversation DIRECTE
     */
    public function createDirect(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id', 'not_in:' . $request->user()->id],
        ]);

        $me = $request->user()->id;
        $other = (int) $data['user_id'];

        $existing = Conversation::whereHas('participants', fn ($q) => $q->where('users.id', $me))
            ->whereHas('participants', fn ($q) => $q->where('users.id', $other))
            ->has('participants', '=', 2)
            ->first();

        if ($existing) {
            return response()->json($existing->load('participants:id,name,email,avatar_path,role'));
        }

        $conversation = Conversation::create();
        $conversation->participants()->attach([$me, $other]);

        return response()->json(
            $conversation->load('participants:id,name,email,avatar_path,role'),
            201
        );
    }

    /**
     * ✅ Créer un groupe
     */
    public function createGroup(Request $request)
    {
        $data = $request->validate([
            'participant_ids'   => ['required', 'array', 'min:2'],
            'participant_ids.*' => ['exists:users,id'],
            'title'             => ['required', 'string', 'max:180'],
        ]);

        $me = $request->user()->id;
        $participantIds = array_unique([...$data['participant_ids'], $me]);

        $conversation = Conversation::create(['title' => $data['title']]);
        $conversation->participants()->attach($participantIds);

        return response()->json(
            $conversation->load('participants:id,name,email,avatar_path,role'),
            201
        );
    }

    /**
     * ✅ Créer une conversation + message
     */
    public function store(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'participant_ids'    => ['required', 'array', 'min:1'],
            'participant_ids.*'  => ['exists:users,id'],
            'title'              => ['nullable', 'string', 'max:180'],
            'body'               => ['required', 'string'],
            'resource_offer_id'  => ['nullable', 'exists:resource_offers,id'],
        ]);

        $conversation = Conversation::create(['title' => $data['title'] ?? null]);

        $participantIds = array_unique([...$data['participant_ids'], $request->user()->id]);
        $conversation->participants()->attach($participantIds);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body'      => $data['body'],
        ]);

        foreach (array_diff($participantIds, [$request->user()->id]) as $userId) {
            $recipient = User::find($userId);
            if (!$recipient) continue;

            $notifications->notify(
                $recipient,
                'new_message',
                '💬 Nouveau message',
                "{$request->user()->name} : " . mb_substr($data['body'], 0, 60),
                $message,
                ['conversation_id' => $conversation->id]
            );
        }

        return response()->json(
            $conversation->load('messages.sender:id,name,avatar_path', 'participants:id,name,email,avatar_path,role'),
            201
        );
    }

    /**
     * ✅ Récupérer les messages + marquer comme lu
     */
    public function messages(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $conversation->participants()->updateExistingPivot(
            $request->user()->id,
            ['last_read_at' => now()]
        );

        return $conversation->messages()
            ->with('sender:id,name,email,avatar_path,role')
            ->get();
    }

    /**
     * ✅ Envoyer un message
     */
    public function sendMessage(Request $request, Conversation $conversation, NotificationService $notifications)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $data = $request->validate([
            'body'       => ['nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx'],
        ]);

        if (empty($data['body']) && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'Message vide.'], 422);
        }

        $payload = [
            'sender_id' => $request->user()->id,
            'body'      => $data['body'] ?? '',
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('messages', 'public');
            $payload['attachment_path'] = $path;
            $payload['attachment_name'] = $file->getClientOriginalName();
            $payload['attachment_type'] = $file->getMimeType();
        }

        $message = $conversation->messages()->create($payload);
        $conversation->touch();

        $conversation->participants()->updateExistingPivot(
            $request->user()->id,
            ['last_read_at' => now()]
        );

        $others = $conversation->participants()
            ->where('users.id', '!=', $request->user()->id)
            ->get();

        foreach ($others as $participant) {
            $preview = $data['body'] ?: '📎 Pièce jointe';
            $notifications->notify(
                $participant,
                'new_message',
                '💬 Nouveau message',
                "{$request->user()->name} : " . mb_substr($preview, 0, 60),
                $message,
                ['conversation_id' => $conversation->id]
            );
        }

        return response()->json(
            $message->load('sender:id,name,email,avatar_path,role'),
            201
        );
    }

    /**
     * ✅ Compteur total non-lus
     */
    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = $request->user()
            ->conversations()
            ->wherePivot('is_archived', false)
            ->get();

        $total = 0;

        foreach ($conversations as $conv) {
            $lastReadAt = $conv->pivot->last_read_at ?? null;

            $total += \App\Models\Message::where('conversation_id', $conv->id)
                ->where('sender_id', '!=', $userId)
                ->when($lastReadAt, fn ($q) => $q->where('created_at', '>', $lastReadAt))
                ->count();
        }

        return response()->json(['unread_count' => $total]);
    }

    /**
     * ✅ Marquer comme NON LUE
     */
    public function markUnread(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $conversation->participants()->updateExistingPivot(
            $request->user()->id,
            ['last_read_at' => null]
        );

        return response()->json(['message' => 'Marquée comme non lue']);
    }

    /**
     * ✅ Archiver / Désarchiver
     */
    public function archive(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $pivot = $conversation->participants()
            ->where('users.id', $request->user()->id)
            ->first()?->pivot;

        $newState = !($pivot->is_archived ?? false);

        $conversation->participants()->updateExistingPivot(
            $request->user()->id,
            ['is_archived' => $newState]
        );

        return response()->json([
            'message' => $newState ? 'Conversation archivée' : 'Conversation désarchivée',
            'is_archived' => $newState,
        ]);
    }

    /**
     * ✅ Ajouter un participant au groupe
     */
    public function addParticipant(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        if ($conversation->participants()->where('users.id', $data['user_id'])->exists()) {
            return response()->json(['message' => 'Déjà membre'], 409);
        }

        $conversation->participants()->attach($data['user_id']);

        return response()->json([
            'message' => 'Participant ajouté',
            'participants' => $conversation->fresh()->load('participants:id,name,email,avatar_path,role')->participants,
        ]);
    }

    /**
     * ✅ Retirer un participant du groupe
     */
    public function removeParticipant(Request $request, Conversation $conversation, $userId)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $conversation->participants()->detach($userId);

        return response()->json([
            'message' => 'Participant retiré',
            'participants' => $conversation->fresh()->load('participants:id,name,email,avatar_path,role')->participants,
        ]);
    }

    /**
     * ✅ Quitter un groupe
     */
    public function leave(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $conversation->participants()->detach($request->user()->id);

        if ($conversation->participants()->count() === 0) {
            $conversation->messages()->delete();
            $conversation->delete();
        }

        return response()->json(['message' => 'Vous avez quitté le groupe']);
    }

    /**
     * ✅ Modifier le titre d'un groupe
     */
    public function update(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
        ]);

        $conversation->update(['title' => $data['title']]);

        return response()->json([
            'message' => 'Titre mis à jour',
            'conversation' => $conversation->fresh(),
        ]);
    }

    /**
     * ✅ Supprimer une conversation
     */
    public function destroy(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        $conversation->participants()->detach($request->user()->id);

        if ($conversation->participants()->count() === 0) {
            $conversation->messages()->delete();
            $conversation->delete();
        }

        return response()->json(['message' => 'Conversation supprimée']);
    }
}