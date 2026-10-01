<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, Arial, sans-serif; background: #0A1229; padding: 24px; color: #fff; margin: 0; }
        .card { max-width: 480px; margin: 0 auto; background: #0F1E45; border-radius: 16px; padding: 32px; }
        .badge { display: inline-block; background: rgba(16,185,129,0.15); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 999px; }
        h1 { font-size: 20px; margin: 16px 0 4px; color: #fff; }
        p { color: #cbd5e1; font-size: 14px; line-height: 1.6; }
        .box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 20px 0; }
        .box p { margin: 4px 0; color: #e2e8f0; }
        .btn { display: inline-block; background: #34d399; color: #0A1229 !important; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 999px; margin-top: 16px; font-size: 14px; }
        .footer { text-align: center; color: #64748b; font-size: 11px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">Entretien confirmé</span>
        <h1>Bonjour {{ $recruiterName }},</h1>
        <p>
            Vous avez programmé un entretien avec <strong>{{ $candidate->name }}</strong>
            pour le poste <strong>« {{ $offer->title }} »</strong>.
        </p>

        <div class="box">
            <p><strong>Candidat :</strong> {{ $candidate->name }} ({{ $candidate->email }})</p>
            <p><strong>Date :</strong> {{ $application->interview_at->locale('fr')->isoFormat('dddd D MMMM YYYY') }}</p>
            <p><strong>Heure :</strong> {{ $application->interview_at->format('H:i') }} (heure de Madagascar)</p>
        </div>

        <a href="{{ $application->interview_link }}" class="btn">Rejoindre l'entretien</a>

        <p style="margin-top:20px;">
            Un fichier joint vous permet d'ajouter ce rendez-vous à votre calendrier.
            Le candidat a reçu le même lien de visioconférence : vous serez dans la même salle.
        </p>

        <div class="footer">TalentShare — notification automatique.</div>
    </div>
</body>
</html>