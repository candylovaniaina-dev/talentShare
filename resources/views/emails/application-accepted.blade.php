<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Candidature acceptée</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:20px; background-color:#F3F6FC; font-family:'Plus Jakarta Sans', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 30px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow:0 4px 24px rgba(11,31,51,0.06);">
        <h2 style="color: #0F9691; font-weight: 800; font-size: 24px; margin-top: 0;">Félicitations ! 🎉</h2>
        
        <p style="color: #0B1F33; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{ $application->profile?->user?->name ?? 'Cher candidat' }}</strong>,</p>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Nous avons le plaisir de vous informer que votre candidature pour le poste de <strong>"{{ $application->jobOffer?->title ?? 'N/A' }}"</strong> chez <strong>{{ $application->jobOffer?->company?->name ?? 'N/A' }}</strong> a été <strong>acceptée</strong>.</p>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Toute l'équipe est ravie de vous compter parmi nous. Un message de bienvenue vous a été envoyé dans votre messagerie sur la plateforme.</p>

        <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin-bottom: 0;">À très vite,<br>L'équipe <strong style="color:#0B1F33;">TalentShare</strong></p>
    </div>
</body>
</html>