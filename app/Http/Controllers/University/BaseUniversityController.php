<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\University;
use Illuminate\Http\Request;

abstract class BaseUniversityController extends Controller
{
    protected function uni(Request $r): University
    {
        return $r->attributes->get('university');
    }

    protected function role(Request $r): string
    {
        return $r->attributes->get('university_role');
    }

    /** Écriture : propriétaire, administrateur ou service des stages. */
    protected function requireWrite(Request $r): void
    {
        abort_unless(in_array($this->role($r), ['owner', 'admin', 'internship_office'], true), 403, "Droits insuffisants pour cette action.");
    }

    /** Gestion de l'établissement et de l'équipe : propriétaire ou administrateur. */
    protected function requireAdmin(Request $r): void
    {
        abort_unless(in_array($this->role($r), ['owner', 'admin'], true), 403, "Action réservée aux administrateurs de l'établissement.");
    }

    /** Fiche entreprise allégée, indépendante des noms de colonnes exacts. */
    protected function companyCard($c): ?array
    {
        if (! $c) {
            return null;
        }
        return [
            'id'       => $c->id,
            'name'     => $c->getAttribute('name'),
            'logo_url' => $c->getAttribute('logo_url') ?: $c->getAttribute('logo_path'),
            'city'     => $c->getAttribute('city'),
            'sector'   => $c->getAttribute('sector') ?: $c->getAttribute('industry'),
        ];
    }
}
