
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Félicitations - Présélection | TalentShare</title>
</head>

<body style="margin:0; padding:0; background-color:#F3F6F9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#10233F;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F6F9; padding:20px 10px;">
<tr>
<td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">

    <!-- HEADER TALENTSHARE -->
    <tr>
        <td style="padding:18px 22px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="left" valign="middle">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td valign="middle" style="padding-right:8px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="center" valign="middle" style="width:28px; height:28px; border-radius:50%; background-color:#D5F5E9; color:#0BA77D; font-size:19px; font-weight:bold;">
                                                ♥
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td valign="middle" style="font-size:20px; font-weight:800; letter-spacing:-0.6px; white-space:nowrap;">
                                    <span style="color:#10233F;">Talent</span><span style="color:#0BA77D;">Share</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td align="right" valign="middle" style="font-size:9px; line-height:1.5; color:#8292A8;">
                        Les talents d’aujourd’hui,<br>
                        les opportunités de demain
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- BANNIÈRE DE FÉLICITATIONS -->
    <tr>
        <td style="padding:0 16px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EAF9F3; border-radius:10px;">
                <tr>
                    <td width="72" align="center" valign="middle" style="padding:15px 0 15px 8px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" valign="middle" style="width:44px; height:44px; background-color:#CCF2E3; border-radius:50%; color:#08A27A; font-size:26px; font-weight:bold;">
                                    ✓
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="middle" style="padding:15px 12px;">
                        <h1 style="margin:0 0 3px; font-size:20px; line-height:1.3; font-weight:800; color:#10233F;">
                            Félicitations !
                        </h1>
                        <p style="margin:0; font-size:12px; line-height:1.5; color:#58718E;">
                            Vous êtes présélectionné(e)
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- CONTENU PRINCIPAL -->
    <tr>
        <td style="padding:18px 22px 20px;">

            <p style="margin:0 0 10px; font-size:12px; line-height:1.6; color:#10233F;">
                Bonjour <strong>{{ $candidate?->name ?? 'Candidat' }}</strong>,
            </p>

            <p style="margin:0 0 13px; font-size:12px; line-height:1.65; color:#58718E;">
                Excellente nouvelle !
                <strong style="color:#0BA77D;">{{ $company?->name ?? 'L’entreprise' }}</strong>
                a présélectionné votre candidature pour le poste :
            </p>

            <!-- CARTE DU POSTE -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:13px; background-color:#F7FAFC; border:1px solid #E7EEF4; border-radius:8px;">
                <tr>
                    <td width="62" align="center" valign="middle" style="padding:11px 0 11px 8px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" valign="middle" style="width:38px; height:38px; border-radius:8px; background-color:#CFF4E5; color:#079B75; font-size:21px; font-weight:bold;">
                                    ▣
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="middle" style="padding:10px 10px 10px 7px;">
                        <p style="margin:0 0 4px; color:#10233F; font-size:13px; line-height:1.4; font-weight:800;">
                            {{ $offer?->title ?? 'Poste proposé' }}
                        </p>

                        @if($offer?->city)
                        <p style="margin:0; color:#71849C; font-size:10px; line-height:1.5;">
                            <span style="color:#0BA77D;">●</span>
                            &nbsp;{{ $offer->city }}{{ $offer->country ? ', ' . $offer->country : '' }}
                        </p>
                        @endif
                    </td>
                </tr>
            </table>

            <!-- CONSEIL : RESTEZ CONNECTÉ -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px; background-color:#F0FAF7; border-left:3px solid #0BA77D; border-radius:7px;">
                <tr>
                    <td width="39" align="center" valign="top" style="padding:12px 0 10px 5px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" valign="middle" style="width:25px; height:25px; background-color:#D7F4E9; border-radius:50%; color:#0BA77D; font-size:15px; font-weight:bold;">
                                    ✉
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td valign="middle" style="padding:11px 10px 11px 3px;">
                        <p style="margin:0 0 4px; color:#078566; font-size:11px; line-height:1.4; font-weight:800;">
                            Restez connecté(e) !
                        </p>
                        <p style="margin:0; color:#58718E; font-size:10px; line-height:1.65;">
                            Le recruteur va bientôt vous contacter pour planifier un entretien. Surveillez votre boîte mail et vos notifications sur TalentShare.
                        </p>
                    </td>
                </tr>
            </table>

            <!-- TEXTE EXPLICATIF -->
            <p style="margin:0 0 13px; color:#58718E; font-size:11px; line-height:1.7;">
                Vous pouvez suivre l'avancement de votre candidature en temps réel depuis votre espace personnel :
            </p>

            <!-- BOUTON CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 15px;">
                <tr>
                    <td align="center" bgcolor="#0BA77D" style="border-radius:7px;">
                        <a href="{{ rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') }}/applications/{{ $application->id }}"
                           style="display:inline-block; padding:11px 23px; color:#FFFFFF; text-decoration:none; font-size:11px; line-height:1.4; font-weight:700; border-radius:7px;">
                            Voir ma candidature 
                        </a>
                    </td>
                </tr>
            </table>

            <!-- SIGNATURE -->
            <p style="margin:0; color:#71849C; font-size:10px; line-height:1.7;">
                Bonne chance pour la suite !<br>
                L'équipe <strong style="color:#0BA77D;">TalentShare</strong>
            </p>

        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td align="center" style="padding:12px 15px; background-color:#F8FAFC; border-top:1px solid #E9EFF5;">
            <p style="margin:0; color:#8B9AAF; font-size:9px; line-height:1.8;">
                <span style="color:#0BA77D; font-size:13px;">♡</span><br>
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
