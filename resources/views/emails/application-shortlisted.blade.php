<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Félicitations - Présélection | TalentShare</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>

<body style="margin:0; padding:0; background-color:#F3F6FC; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#0B1F33;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F6FC; padding:30px 15px;">
<tr>
<td align="center">

<!-- CARTE PRINCIPALE -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(11,31,51,0.08);">

    <!-- HEADER TALENTSHARE -->
    <tr>
        <td style="padding:24px 30px 20px; border-bottom:1px solid #E2E8F0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="left" valign="middle">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td valign="middle" style="padding-right:10px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="center" valign="middle" style="width:34px; height:34px; border-radius:10px; background-color:#16B8B1; color:#0B1F33; font-size:20px; font-weight:900;">
                                                ♥
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td valign="middle" style="font-size:22px; font-weight:800; letter-spacing:-0.5px; white-space:nowrap; font-family:'Plus Jakarta Sans', Arial, sans-serif;">
                                    <span style="color:#0B1F33;">Talent</span><span style="color:#0F9691;">Share</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td align="right" valign="middle" style="font-size:10px; line-height:1.6; color:#64748B; font-weight:500;">
                        Les talents d’aujourd’hui,<br>
                        les opportunités de demain
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- BANNIÈRE DE FÉLICITATIONS -->
    <tr>
        <td style="padding:30px 30px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F6FC; border-radius:12px; border:1px solid #E2E8F0;">
                <tr>
                    <td width="80" align="center" valign="middle" style="padding:20px 0 20px 10px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" valign="middle" style="width:50px; height:50px; background-color:#16B8B1; border-radius:50%; color:#0B1F33; font-size:28px; font-weight:bold;">
                                    ✓
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="middle" style="padding:20px 15px;">
                        <h1 style="margin:0 0 4px; font-size:22px; line-height:1.3; font-weight:800; color:#0B1F33; font-family:'Plus Jakarta Sans', Arial, sans-serif;">
                            Félicitations !
                        </h1>
                        <p style="margin:0; font-size:13px; line-height:1.5; color:#475569; font-weight:500;">
                            Vous êtes présélectionné(e)
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- CONTENU PRINCIPAL -->
    <tr>
        <td style="padding:24px 30px 30px;">

            <p style="margin:0 0 12px; font-size:14px; line-height:1.6; color:#0B1F33; font-weight:600;">
                Bonjour <strong>{{ $candidate?->name ?? 'Candidat' }}</strong>,
            </p>

            <p style="margin:0 0 20px; font-size:14px; line-height:1.7; color:#475569; font-weight:400;">
                Excellente nouvelle ! 
                <strong style="color:#0B1F33;">{{ $company?->name ?? 'L’entreprise' }}</strong> 
                a présélectionné votre candidature pour le poste :
            </p>

            <!-- CARTE DU POSTE -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px;">
                <tr>
                    <td width="70" align="center" valign="middle" style="padding:15px 0 15px 10px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" valign="middle" style="width:44px; height:44px; border-radius:10px; background-color:#E8F8F7; color:#0F9691; font-size:24px; font-weight:bold;">
                                    ▣
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="middle" style="padding:15px 15px 15px 10px;">
                        <p style="margin:0 0 6px; color:#0B1F33; font-size:15px; line-height:1.4; font-weight:700; font-family:'Plus Jakarta Sans', Arial, sans-serif;">
                            {{ $offer?->title ?? 'Poste proposé' }}
                        </p>
                        @if($offer?->city)
                        <p style="margin:0; color:#64748B; font-size:12px; line-height:1.5; font-weight:500;">
                            <span style="color:#16B8B1;">●</span>
                            &nbsp;{{ $offer->city }}{{ $offer->country ? ', ' . $offer->country : '' }}
                        </p>
                        @endif
                    </td>
                </tr>
            </table>

            <!-- CONSEIL : RESTEZ CONNECTÉ -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px; background-color:#F3F6FC; border-left:4px solid #16B8B1; border-radius:8px;">
                <tr>
                    <td width="45" align="center" valign="top" style="padding:16px 0 16px 8px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" valign="middle" style="width:30px; height:30px; background-color:#16B8B1; border-radius:50%; color:#0B1F33; font-size:16px; font-weight:bold;">
                                    ✉
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="middle" style="padding:16px 15px 16px 5px;">
                        <p style="margin:0 0 4px; color:#0B1F33; font-size:13px; line-height:1.4; font-weight:700; font-family:'Plus Jakarta Sans', Arial, sans-serif;">
                            Restez connecté(e) !
                        </p>
                        <p style="margin:0; color:#475569; font-size:12px; line-height:1.65; font-weight:400;">
                            Le recruteur va bientôt vous contacter pour planifier un entretien. Surveillez votre boîte mail et vos notifications sur TalentShare.
                        </p>
                    </td>
                </tr>
            </table>

            <!-- TEXTE EXPLICATIF -->
            <p style="margin:0 0 20px; color:#64748B; font-size:13px; line-height:1.7; font-weight:400; text-align:center;">
                Vous pouvez suivre l'avancement de votre candidature en temps réel depuis votre espace personnel :
            </p>

            <!-- BOUTON CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 25px;">
                <tr>
                    <td align="center" bgcolor="#0B1F33" style="border-radius:10px; box-shadow:0 4px 10px rgba(11,31,51,0.2);">
                        <a href="{{ rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') }}/applications/{{ $application->id }}"
                           style="display:inline-block; padding:14px 28px; color:#FFFFFF; text-decoration:none; font-size:14px; line-height:1.4; font-weight:700; border-radius:10px; font-family:'Plus Jakarta Sans', Arial, sans-serif;">
                            Voir ma candidature 
                        </a>
                    </td>
                </tr>
            </table>

            <!-- SIGNATURE -->
            <p style="margin:0; color:#64748B; font-size:12px; line-height:1.7; text-align:center; font-weight:400;">
                Bonne chance pour la suite !<br>
                L'équipe <strong style="color:#0B1F33;">TalentShare</strong>
            </p>

        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td align="center" style="padding:20px 15px; background-color:#F8FAFC; border-top:1px solid #E2E8F0;">
            <p style="margin:0; color:#94A3B8; font-size:10px; line-height:1.8; font-weight:500;">
                <span style="color:#16B8B1; font-size:14px;">♡</span><br>
                Cet email a été envoyé automatiquement par TalentShare.<br>
                Merci de ne pas y répondre directement.
            </p>
        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>