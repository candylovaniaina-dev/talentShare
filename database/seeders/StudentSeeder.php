<?php

namespace Database\Seeders;

use App\Models\University;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer l'université d'Antananarivo
        $university = University::where('slug', 'universite-dantananarivo')->first()
                   ?? University::first();

        if (! $university) {
            $this->command->error('Aucune université trouvée. Lancez UniversitySeeder d\'abord.');
            return;
        }

        $this->command->info("Rattachement des étudiants à : {$university->name}");

        // Liste de 8 étudiants de test
        $students = [
            ['name' => 'Rakoto Andrianina',    'email' => 'rakoto.andrianina@test.mg',    'status' => 'approved'],
            ['name' => 'Rasoa Miora',           'email' => 'rasoa.miora@test.mg',           'status' => 'approved'],
            ['name' => 'Randrianasolo Toky',    'email' => 'randrianasolo.toky@test.mg',    'status' => 'approved'],
            ['name' => 'Ravelo Sitraka',        'email' => 'ravelo.sitraka@test.mg',        'status' => 'pending'],
            ['name' => 'Rasolofonirina Hery',   'email' => 'rasolofonirina.hery@test.mg',   'status' => 'pending'],
            ['name' => 'Rajaonarison Lova',     'email' => 'rajaonarison.lova@test.mg',     'status' => 'pending'],
            ['name' => 'Andriamihaja Nirina',   'email' => 'andriamihaja.nirina@test.mg',   'status' => 'rejected'],
            ['name' => 'Rakotomalala Fanja',    'email' => 'rakotomalala.fanja@test.mg',    'status' => 'approved'],
        ];

        foreach ($students as $index => $data) {
            // Vérifier si l'utilisateur existe déjà
            $user = User::where('email', $data['email'])->first();

            if (! $user) {
                $user = User::create([
                    'name'     => $data['name'],
                    'email'    => $data['email'],
                    'password' => Hash::make('password123'),
                    'role'     => 'student',
                ]);
            }

            // Rattacher à l'université avec le statut
            $user->update([
                'university_id'          => $university->id,
                'university_status'      => $data['status'],
                'university_verified_at' => $data['status'] === 'approved' ? now() : null,
            ]);

            $this->command->info("  ✓ {$data['name']} ({$data['status']})");
        }

        $this->command->info('✅ Seeder StudentSeeder terminé !');
        $this->command->info("Total étudiants validés : " . $university->approvedStudents()->count());
        $this->command->info("Total en attente : " . $university->pendingStudents()->count());
    }
}