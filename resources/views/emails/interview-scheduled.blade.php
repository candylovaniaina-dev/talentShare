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

        .warn {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 20px;
        }
        .warn p { color: #92400e; font-size: 13px; margin: 0; }
        .warn a { color: #92400e; text-decoration: underline; font-weight: 700; }
    </style>
</head>
<body>
    <div class="card">

        @if($emailNotVerified ?? false)
            <div class="warn">
                <p>
                    ⚠️ <strong>Votre adresse email n'est pas encore vérifiée.</strong>
                    Pour recevoir les prochaines communications de <strong>TalentShare</strong> et de
                    <strong>{{ $company?->name }}</strong>, merci de confirmer votre adresse.
                </p>
                @if(!empty($verificationUrl))
                    <p style="margin-top:8px;">
                        <a href="{{ $verificationUrl }}">Vérifier mon adresse email →</a>
                    </p>
                @endif
            </div>
        @endif

        <span class="badge">Entretien programmé</span>

        <h1>Bonjour {{ $candidateName }},</h1>

        <p>
            <strong>{{ $company?->name }}</strong> souhaite vous rencontrer pour le poste
            <strong>« {{ $offer->title }} »</strong>.
        </p>

        <div class="box">
            <p><strong>Date :</strong> {{ $application->interview_at->locale('fr')->isoFormat('dddd D MMMM YYYY') }}</p>
            <p><strong>Heure :</strong> {{ $application->interview_at->format('H:i') }} (heure de Madagascar)</p>
            <p><strong>Format :</strong> Visioconférence</p>
        </div>

        <a href="{{ $application->interview_link }}" class="btn">Rejoindre l'entretien</a>

        <p style="margin-top:20px;">
            Un fichier joint à cet email vous permet d'ajouter automatiquement ce rendez-vous
            à votre calendrier (Google Calendar, Outlook, Apple Calendar...).
        </p>

        <div class="footer">
            TalentShare — vous recevez cet email car votre candidature a évolué.
        </div>
    </div>
</body>
</html>