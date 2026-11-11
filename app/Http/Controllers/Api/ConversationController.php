<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // 1. On récupère les conversations
        $conversations = $request->user()->conversations()
            ->wherePivot('is_archived', false)
            ->with([
                'participants:id,name,email,avatar_path,role',
                'participants.professionalProfile:id,user_id,avatar_path,headline',
            ])
            ->latest('conversations.updated_at')
            ->get();

        // 2. On filtre les conversations pour ne garder que celles avec au moins 1 message
        $conversations = $conversations->filter(function ($conv) use ($userId) {
            $lastMessage = \App\Models\Message::where('conversation_id', $conv->id)
                ->with([
                    'sender:id,name,email,avatar_path,role',
                    'sender.professionalProfile:id,user_id,avatar_path',
                ])
                ->orderBy('id', 'desc')
                ->first();

            // Si aucun message, on ignore cette conversation
            if (!$lastMessage) {
                return false;
            }

            // On attache le dernier message
            $conv->setRelation('messages', collect([$lastMessage]));

            // Calcul des non-lus
            $lastReadAt = $conv->pivot->last_read_at ?? null;
            $conv->unread_count = \App\Models\Message::where('conversation_id', $conv->id)
                ->where('sender_id', '!=', $userId)
                ->when($lastReadAt, fn ($q) => $q->where('created_at', '>', $lastReadAt))
                ->count();

            $conv->is_group = $conv->participants->count() > 2 || !empty($conv->title);
            $conv->group_title = $conv->title;

            return true;
        })->values();

        return $conversations;
    }

    public function show(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403
        );

        return $conversation->load([
            'participants:id,name,email,avatar_path,role',
            'participants.professionalProfile:id,user_id,avatar_path,headline',
        ]);
    }

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
            ->with([
                'participants:id,name,email,avatar_path,role',
                'participants.professionalProfile:id,user_id,avatar_path,headline',
            ])
            ->first();

        if ($existing) {
            return response()->json([
                'exists' => true,
                'conversation' => $existing,
            ]);
        }

        $conversation = Conversation::create(['title' => null]);
        $conversation->participants()->attach([$me, $other]);

        $conversation->load([
            'participants:id,name,email,avatar_path,role',
            'participants.professionalProfile:id,user_id,avatar_path,headline',
        ]);

        return response()->json([
            'exists' => false,
            'conversation' => $conversation,
        ], 201);
    }

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
            $conversation->load([
                'participants:id,name,email,avatar_path,role',
                'participants.professionalProfile:id,user_id,avatar_path,headline',
            ]),
            201
        );
    }

    public function store(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'participant_ids'    => ['required', 'array', 'min:1'],
            'participant_ids.*'  => ['exists:users,id'],
            'title'              => ['nullable', 'string', 'max:180'],
            'body'               => ['nullable', 'string'],
            'attachment'         => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx'],
            'resource_offer_id'  => ['nullable', 'exists:resource_offers,id'],
        ]);

        if (empty($data['body']) && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'Message vide.'], 422);
        }

        $conversation = Conversation::create(['title' => $data['title'] ?? null]);
        $participantIds = array_unique([...$data['participant_ids'], $request->user()->id]);
        $conversation->participants()->attach($participantIds);

        $payload = [
            'sender_id' => $request->user()->id,
            'body'      => $data['body'] ?? '',
            'type'      => 'text', // ✅ Initialisation du type
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('messages', 'public');
            $payload['attachment_path'] = $path;
            $payload['attachment_name'] = $file->getClientOriginalName();
            $payload['attachment_type'] = $file->getMimeType();
        }

        $message = $conversation->messages()->create($payload);

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
            $conversation->fresh()->load([
                'messages.sender:id,name,email,avatar_path,role',
                'messages.sender.professionalProfile:id,user_id,avatar_path',
                'participants:id,name,email,avatar_path,role',
                'participants.professionalProfile:id,user_id,avatar_path,headline',
            ]),
            201
        );
    }

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
            ->with([
                'sender:id,name,email,avatar_path,role',
                'sender.professionalProfile:id,user_id,avatar_path,headline',
            ])
            ->get();
    }

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
            'type'      => 'text', // ✅ Initialisation du type
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
            $message->load([
                'sender:id,name,email,avatar_path,role',
                'sender.professionalProfile:id,user_id,avatar_path,headline',
            ]),
            201
        );
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;
        $conversations = $request->user()->conversations()->wherePivot('is_archived', false)->get();
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

    public function markUnread(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);
        $conversation->participants()->updateExistingPivot($request->user()->id, ['last_read_at' => null]);
        return response()->json(['message' => 'Marquée comme non lue']);
    }

    public function archive(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);
        $pivot = $conversation->participants()->where('users.id', $request->user()->id)->first()?->pivot;
        $newState = !($pivot->is_archived ?? false);
        $conversation->participants()->updateExistingPivot($request->user()->id, ['is_archived' => $newState]);
        return response()->json(['message' => $newState ? 'Conversation archivée' : 'Conversation désarchivée', 'is_archived' => $newState]);
    }

    public function addParticipant(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);
        $data = $request->validate(['user_id' => ['required', 'exists:users,id']]);

        if ($conversation->participants()->where('users.id', $data['user_id'])->exists()) {
            return response()->json(['message' => 'Déjà membre'], 409);
        }

        // 1. Ajouter le participant
        $conversation->participants()->attach($data['user_id']);
        
        // 2. Récupérer les noms pour le message
        $newUser = User::find($data['user_id']);
        $adminName = $request->user()->name;

        // 3. Créer un message SYSTÈME
        $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => "{$adminName} a ajouté {$newUser->name} au groupe.",
            'type' => 'system', // ✅ Type système
        ]);

        // 4. Mettre à jour la date de la conversation pour qu'elle remonte en haut
        $conversation->touch();

        return response()->json([
            'message' => 'Participant ajouté',
            'participants' => $conversation->fresh()->load([
                'participants:id,name,email,avatar_path,role',
                'participants.professionalProfile:id,user_id,avatar_path,headline',
            ])->participants,
        ]);
    }

    public function removeParticipant(Request $request, Conversation $conversation, $userId)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);
        
        $removedUser = User::find($userId);
        $adminName = $request->user()->name;
        
        $conversation->participants()->detach($userId);

        // Créer un message système pour le retrait
        if ($removedUser) {
            $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => "{$adminName} a retiré {$removedUser->name} du groupe.",
                'type' => 'system',
            ]);
            $conversation->touch();
        }

        return response()->json([
            'message' => 'Participant retiré',
            'participants' => $conversation->fresh()->load([
                'participants:id,name,email,avatar_path,role',
                'participants.professionalProfile:id,user_id,avatar_path,headline',
            ])->participants,
        ]);
    }

    public function leave(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);
        
        $userName = $request->user()->name;
        
        // Créer le message système avant de quitter
        $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => "{$userName} a quitté le groupe.",
            'type' => 'system',
        ]);
        
        $conversation->participants()->detach($request->user()->id);

        if ($conversation->participants()->count() === 0) {
            $conversation->messages()->delete();
            $conversation->delete();
        }

        return response()->json(['message' => 'Vous avez quitté le groupe']);
    }

    public function update(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);
        $data = $request->validate(['title' => ['required', 'string', 'max:180']]);
        $conversation->update(['title' => $data['title']]);

        // Optionnel : Créer un message système pour le changement de nom
        $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => "{$request->user()->name} a renommé le groupe en \"{$data['title']}\".",
            'type' => 'system',
        ]);
        $conversation->touch();

        return response()->json([
            'message' => 'Titre mis à jour',
            'conversation' => $conversation->fresh(),
        ]);
    }

    public function destroy(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);
        $conversation->participants()->detach($request->user()->id);

        if ($conversation->participants()->count() === 0) {
            $conversation->messages()->delete();
            $conversation->delete();
        }

        return response()->json(['message' => 'Conversation supprimée']);
    }
}