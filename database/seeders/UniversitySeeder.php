<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\University;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UniversitySeeder extends Seeder
{
    public function run(): void
    {
        // On récupère un utilisateur pour être propriétaire
        // (le premier admin, ou l'utilisateur ID 1)
        $owner = User::where('role', 'admin')->first()
                ?? User::first();

        if (! $owner) {
            $this->command->error('Aucun utilisateur trouvé. Créez un utilisateur d\'abord.');
            return;
        }

        // ─── Données des universités malgaches ────────────────
        $universitiesData = [
            [
                'name'        => 'Université d\'Antananarivo',
                'description' => 'La plus grande université publique de Madagascar, fondée en 1961.',
                'country'     => 'Madagascar',
                'city'        => 'Antananarivo',
                'address'     => 'BP 566, Ankatso, Antananarivo 101',
                'latitude'    => -18.9137,
                'longitude'   => 47.5361,
                'website'     => 'https://univ-antananarivo.mg',
                'is_verified' => true,
            ],
            [
                'name'        => 'Université de Fianarantsoa',
                'description' => 'Université publique située dans les hautes terres du sud.',
                'country'     => 'Madagascar',
                'city'        => 'Fianarantsoa',
                'address'     => 'BP 1264, Fianarantsoa 301',
                'latitude'    => -21.4527,
                'longitude'   => 47.0857,
                'website'     => 'https://univ-fianarantsoa.mg',
                'is_verified' => true,
            ],
            [
                'name'        => 'Université de Toamasina',
                'description' => 'Université publique de la côte est, spécialisée en sciences marines.',
                'country'     => 'Madagascar',
                'city'        => 'Toamasina',
                'address'     => 'BP 591, Toamasina 501',
                'latitude'    => -18.1492,
                'longitude'   => 49.4023,
                'website'     => 'https://univ-toamasina.mg',
                'is_verified' => true,
            ],
            [
                'name'        => 'Université de Mahajanga',
                'description' => 'Université publique du nord-ouest, pôle en médecine et sciences.',
                'country'     => 'Madagascar',
                'city'        => 'Mahajanga',
                'address'     => 'BP 652, Mahajanga 401',
                'latitude'    => -15.7167,
                'longitude'   => 46.3167,
                'website'     => 'https://univ-mahajanga.mg',
                'is_verified' => false,
            ],
            [
                'name'        => 'Université de Toliara',
                'description' => 'Université publique du sud, spécialisée en environnement et halieutique.',
                'country'     => 'Madagascar',
                'city'        => 'Toliara',
                'address'     => 'BP 185, Toliara 601',
                'latitude'    => -23.3500,
                'longitude'   => 43.6667,
                'website'     => 'https://univ-toliara.mg',
                'is_verified' => false,
            ],
            [
                'name'        => 'Université d\'Antsiranana',
                'description' => 'Université publique de l\'extrême nord, pôle en sciences et technologies.',
                'country'     => 'Madagascar',
                'city'        => 'Antsiranana',
                'address'     => 'BP 0, Antsiranana 201',
                'latitude'    => -12.2787,
                'longitude'   => 49.2913,
                'website'     => 'https://univ-antsiranana.mg',
                'is_verified' => false,
            ],
        ];

        // ─── Facultés par université ────────────────────────
        $facultiesData = [
            'Faculté des Sciences',
            'Faculté des Lettres et Sciences Humaines',
            'Faculté de Droit, d\'Économie et de Gestion',
            'Faculté de Médecine',
        ];

        // ─── Départements par faculté ───────────────────────
        $departmentsData = [
            'Département Informatique',
            'Département Mathématiques',
            'Département Physique',
            'Département Biologie',
        ];

        // ─── Programmes par département ─────────────────────
        $programsData = [
            ['name' => 'Licence Informatique',       'level' => 'Licence',  'duration_months' => 36],
            ['name' => 'Master Génie Logiciel',      'level' => 'Master',   'duration_months' => 24],
            ['name' => 'Licence Mathématiques',      'level' => 'Licence',  'duration_months' => 36],
            ['name' => 'Master Data Science',        'level' => 'Master',   'duration_months' => 24],
        ];

        // ─── Création ───────────────────────────────────────
        foreach ($universitiesData as $uData) {

            $university = University::create([
                'owner_user_id' => $owner->id,
                'name'          => $uData['name'],
                'slug'          => Str::slug($uData['name']),
                'description'   => $uData['description'],
                'country'       => $uData['country'],
                'city'          => $uData['city'],
                'address'       => $uData['address'],
                'latitude'      => $uData['latitude'],
                'longitude'     => $uData['longitude'],
                'website'       => $uData['website'],
                'is_verified'   => $uData['is_verified'],
            ]);

            $this->command->info("Université créée : {$university->name}");

            // Créer 2 facultés par université
            $facultiesSlice = array_slice($facultiesData, 0, 2);

            foreach ($facultiesSlice as $fName) {
                $faculty = Faculty::create([
                    'university_id' => $university->id,
                    'name'          => $fName,
                    'slug'          => Str::slug($fName),
                    'description'   => "Faculté de {$university->name}",
                ]);

                // Créer 2 départements par faculté
                $departmentsSlice = array_slice($departmentsData, 0, 2);

                foreach ($departmentsSlice as $dName) {
                    $department = Department::create([
                        'faculty_id'  => $faculty->id,
                        'name'        => $dName,
                        'slug'        => Str::slug($dName),
                        'description' => "Département de {$fName}",
                    ]);

                    // Créer 2 programmes par département
                    $programsSlice = array_slice($programsData, 0, 2);

                    foreach ($programsSlice as $pData) {
                        Program::create([
                            'department_id'   => $department->id,
                            'name'            => $pData['name'],
                            'slug'            => Str::slug($pData['name'] . '-' . $department->id),
                            'description'     => "Formation de {$dName}",
                            'level'           => $pData['level'],
                            'duration_months' => $pData['duration_months'],
                            'language'        => 'fr',
                            'tuition_fee'     => 0,
                            'currency'        => 'MGA',
                            'is_active'       => true,
                        ]);
                    }
                }
            }
        }

        $this->command->info('✅ Seeder UniversitySeeder terminé avec succès !');
    }
}