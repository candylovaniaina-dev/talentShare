<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Candidature acceptée</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px;">
        <h2 style="color: #10b981;">Félicitations ! 🎉</h2>
        
        <p>Bonjour <strong>{{ $application->profile?->user?->name ?? 'Cher candidat' }}</strong>,</p>
        
        <p>Nous avons le plaisir de vous informer que votre candidature pour le poste de <strong>"{{ $application->jobOffer?->title ?? 'N/A' }}"</strong> chez <strong>{{ $application->jobOffer?->company?->name ?? 'N/A' }}</strong> a été <strong>acceptée</strong>.</p>
        
        <p>Toute l'équipe est ravie de vous compter parmi nous. Un message de bienvenue vous a été envoyé dans votre messagerie sur la plateforme.</p>

        <p>À très vite,<br>L'équipe TalentShare</p>
    </div>
</body>
</html>