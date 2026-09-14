<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        return $request->user()->conversations()
            ->with(['messages' => fn ($q) => $q->latest()->limit(1), 'participants:id,name'])
            ->latest('conversations.updated_at')
            ->get()
            ->map(function ($conv) use ($userId) {
                // ✅ Compter les messages non lus (messages des autres)
                $lastReadAt = $conv->pivot->last_read_at ?? null;

                $conv->unread_count = $conv->messages()
                    ->where('sender_id', '!=', $userId)
                    ->when($lastReadAt, fn ($q) => $q->where('created_at', '>', $lastReadAt))
                    ->when(!$lastReadAt, fn ($q) => $q->whereNull('read_at'))
                    ->count();

                return $conv;
            });
    }

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

        // ✅ Notifier tous les autres participants
        foreach (array_diff($participantIds, [$request->user()->id]) as $userId) {
            $recipient = \App\Models\User::find($userId);
            if (!$recipient) continue;

            // Notification "nouveau message"
            $notifications->notify(
                $recipient,
                'new_message',
                '💬 Nouveau message',
                "{$request->user()->name} : " . mb_substr($data['body'], 0, 60) . (mb_strlen($data['body']) > 60 ? '...' : ''),
                $message,
                ['conversation_id' => $conversation->id]
            );

            // ✅ Si lié à une offre → notif "offre contactée"
            if (!empty($data['resource_offer_id'])) {
                $offer = \App\Models\ResourceOffer::with('company.owner')->find($data['resource_offer_id']);

                if ($offer && $offer->company->owner && $offer->company->owner->id === $userId) {
                    $notifications->notify(
                        $recipient,
                        'offer_contacted',
                        '🎯 Quelqu\'un est intéressé par votre offre',
                        "{$request->user()->name} : " . mb_substr($data['body'], 0, 80),
                        $offer,
                        ['offer_id' => $offer->id]
                    );
                }
            }
        }

        return response()->json($conversation->load('messages', 'participants:id,name'), 201);
    }

    public function messages(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);

        $conversation->participants()->updateExistingPivot($request->user()->id, ['last_read_at' => now()]);

        return $conversation->messages()->with('sender:id,name')->get();
    }

    public function sendMessage(Request $request, Conversation $conversation, NotificationService $notifications)
    {
        abort_unless($conversation->participants()->where('users.id', $request->user()->id)->exists(), 403);

        $data = $request->validate(['body' => ['required', 'string']]);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body'      => $data['body'],
        ]);

        $conversation->touch();

        // ✅ Notifier les autres participants
        $otherParticipants = $conversation->participants()
            ->where('users.id', '!=', $request->user()->id)
            ->get();

        foreach ($otherParticipants as $participant) {
            $notifications->notify(
                $participant,
                'new_message',
                '💬 Nouveau message',
                "{$request->user()->name} : " . mb_substr($data['body'], 0, 60) . (mb_strlen($data['body']) > 60 ? '...' : ''),
                $message,
                ['conversation_id' => $conversation->id]
            );
        }

        return response()->json($message->load('sender:id,name'), 201);
    }
}