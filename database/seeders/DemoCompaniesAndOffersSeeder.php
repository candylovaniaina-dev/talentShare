<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\JobOffer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoCompaniesAndOffersSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================================
        // 1. LES 10 ENTREPRISES
        // ============================================================
        $companies = [
            [
                'name' => 'DataNova',
                'industry' => 'Data & Analytics',
                'description' => 'Cabinet spécialisé en analyse de données et business intelligence.',
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Lot II B 12, Analakely',
                'website' => 'https://datanova.mg',
                'size' => '10-50',
            ],
            [
                'name' => 'GreenWave',
                'industry' => 'Marketing digital',
                'description' => 'Agence digitale spécialisée en communication et réseaux sociaux.',
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Immeuble Sky, Antanimena',
                'website' => 'https://greenwave.mg',
                'size' => '10-50',
            ],
            [
                'name' => 'Atlas Consulting',
                'industry' => 'Conseil',
                'description' => 'Cabinet de conseil en transformation digitale.',
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Tour Zital, Ankorondrano',
                'website' => 'https://atlas.mg',
                'size' => '50-200',
            ],
            [
                'name' => 'PixelCraft',
                'industry' => 'Design',
                'description' => 'Studio de design UI/UX pour startups et grandes entreprises.',
                'city' => 'Toamasina',
                'country' => 'Madagascar',
                'address' => 'Rue Amiral Billard',
                'website' => 'https://pixelcraft.mg',
                'size' => '10-50',
            ],
            [
                'name' => 'MobileFirst',
                'industry' => 'Développement mobile',
                'description' => "Éditeur d'applications mobiles innovantes.",
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Immeuble Crystallin, Ivandry',
                'website' => 'https://mobilefirst.mg',
                'size' => '50-200',
            ],
            [
                'name' => 'SocialBoost',
                'industry' => 'Community management',
                'description' => 'Agence spécialisée en gestion de communautés en ligne.',
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Bâtiment Orange, Ankorondrano',
                'website' => 'https://socialboost.mg',
                'size' => '1-10',
            ],
            [
                'name' => 'CloudNest',
                'industry' => 'Cloud & DevOps',
                'description' => 'Infrastructure cloud et services DevOps.',
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Explorer Business Park',
                'website' => 'https://cloudnest.io',
                'size' => '50-200',
            ],
            [
                'name' => 'TalentHub',
                'industry' => 'Ressources humaines',
                'description' => 'Cabinet de recrutement spécialisé tech et digital.',
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Immeuble Tsaralalàna',
                'website' => 'https://talenthub.mg',
                'size' => '10-50',
            ],
            [
                'name' => 'OpsFlow',
                'industry' => 'DevOps',
                'description' => 'Automatisation, CI/CD et fiabilité des systèmes.',
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Bâtiment Forello, Tanjombato',
                'website' => 'https://opsflow.io',
                'size' => '10-50',
            ],
            [
                'name' => 'FinEdge',
                'industry' => 'Fintech',
                'description' => "Solutions financières digitales pour l'Afrique.",
                'city' => 'Antananarivo',
                'country' => 'Madagascar',
                'address' => 'Tour Orange, Ankorondrano',
                'website' => 'https://finedge.mg',
                'size' => '50-200',
            ],
        ];

        $createdCompanies = [];

        foreach ($companies as $index => $data) {
            $email = 'demo.company' . ($index + 1) . '@talentshare.test';

            // Créer un user (owner)
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $data['name'],
                    'first_name' => $data['name'],
                    'last_name' => '',
                    'password' => Hash::make('password'),
                    'role' => 'company',
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'country' => $data['country'],
                ]
            );

            // Créer l'entreprise
            $company = Company::firstOrCreate(
                ['name' => $data['name']],
                [
                    'owner_user_id' => $user->id,
                    'slug' => Str::slug($data['name']) . '-' . ($index + 1),
                    'description' => $data['description'],
                    'industry' => $data['industry'],
                    'size' => $data['size'],
                    'country' => $data['country'],
                    'city' => $data['city'],
                    'address' => $data['address'],
                    'website' => $data['website'],
                    'is_verified' => true,
                ]
            );

            $createdCompanies[$data['name']] = $company;
            $this->command->info("✅ Entreprise créée : {$company->name} (owner: {$user->email})");
        }

        // ============================================================
        // 2. LES 12 OFFRES D'EMPLOI
        // ============================================================
        $offers = [
            [
                'title' => 'Développeur web junior',
                'company' => 'DataNova',
                'offer_type' => 'internship',
                'duration_text' => '6 mois',
                'city' => 'Antananarivo',
                'remote' => false,
                'salary_min' => 200000,
                'salary_max' => 350000,
                'criteria' => ['React', 'Laravel', 'SQL'],
            ],
            [
                'title' => 'Assistante marketing digital',
                'company' => 'GreenWave',
                'offer_type' => 'internship',
                'duration_text' => '4 mois',
                'city' => 'Antananarivo',
                'remote' => true,
                'salary_min' => 150000,
                'salary_max' => 250000,
                'criteria' => ['Marketing', 'Réseaux sociaux'],
            ],
            [
                'title' => 'Analyste de données',
                'company' => 'Atlas Consulting',
                'offer_type' => 'first_job',
                'duration_text' => 'CDI',
                'city' => 'Antananarivo',
                'remote' => false,
                'salary_min' => 800000,
                'salary_max' => 1200000,
                'criteria' => ['Excel', 'Power BI', 'Python'],
            ],
            [
                'title' => 'UI/UX Designer',
                'company' => 'PixelCraft',
                'offer_type' => 'first_job',
                'duration_text' => 'CDI',
                'city' => 'Toamasina',
                'remote' => true,
                'salary_min' => 600000,
                'salary_max' => 900000,
                'criteria' => ['Figma', 'Adobe XD'],
            ],
            [
                'title' => 'Développeur mobile Flutter',
                'company' => 'MobileFirst',
                'offer_type' => 'junior_mission',
                'duration_text' => '3 mois',
                'city' => 'Antananarivo',
                'remote' => true,
                'salary_min' => 500000,
                'salary_max' => 800000,
                'criteria' => ['Flutter', 'Dart', 'Firebase'],
            ],
            [
                'title' => 'Community Manager',
                'company' => 'SocialBoost',
                'offer_type' => 'apprenticeship',
                'duration_text' => '12 mois',
                'city' => 'Antananarivo',
                'remote' => false,
                'salary_min' => 180000,
                'salary_max' => 300000,
                'criteria' => ['Instagram', 'TikTok', 'Canva'],
            ],
            [
                'title' => 'Développeur back-end Node.js',
                'company' => 'CloudNest',
                'offer_type' => 'first_job',
                'duration_text' => 'CDI',
                'city' => 'Antananarivo',
                'remote' => true,
                'salary_min' => 900000,
                'salary_max' => 1500000,
                'criteria' => ['Node.js', 'Express', 'PostgreSQL', 'Docker'],
            ],
            [
                'title' => 'Chargé de recrutement',
                'company' => 'TalentHub',
                'offer_type' => 'internship',
                'duration_text' => '6 mois',
                'city' => 'Antananarivo',
                'remote' => false,
                'salary_min' => 200000,
                'salary_max' => 320000,
                'criteria' => ['Sourcing', 'LinkedIn'],
            ],
            [
                'title' => 'Ingénieur DevOps',
                'company' => 'OpsFlow',
                'offer_type' => 'first_job',
                'duration_text' => 'CDI',
                'city' => 'Antananarivo',
                'remote' => true,
                'salary_min' => 1200000,
                'salary_max' => 2000000,
                'criteria' => ['AWS', 'Kubernetes', 'Terraform'],
            ],
            [
                'title' => 'Développeur React Senior',
                'company' => 'FinEdge',
                'offer_type' => 'first_job',
                'duration_text' => 'CDI',
                'city' => 'Antananarivo',
                'remote' => true,
                'salary_min' => 1500000,
                'salary_max' => 2500000,
                'criteria' => ['React', 'TypeScript', 'Next.js'],
            ],
            [
                'title' => 'Data Scientist',
                'company' => 'DataNova',
                'offer_type' => 'first_job',
                'duration_text' => 'CDI',
                'city' => 'Antananarivo',
                'remote' => false,
                'salary_min' => 1200000,
                'salary_max' => 1800000,
                'criteria' => ['Python', 'TensorFlow', 'Pandas'],
            ],
            [
                'title' => 'Chef de projet digital',
                'company' => 'GreenWave',
                'offer_type' => 'first_job',
                'duration_text' => 'CDI',
                'city' => 'Antananarivo',
                'remote' => true,
                'salary_min' => 1000000,
                'salary_max' => 1500000,
                'criteria' => ['Gestion de projet', 'Agile'],
            ],
        ];

        foreach ($offers as $offerData) {
            $company = $createdCompanies[$offerData['company']] ?? null;
            if (!$company) continue;

            JobOffer::firstOrCreate(
                [
                    'title' => $offerData['title'],
                    'company_id' => $company->id,
                ],
                [
                    'company_id' => $company->id,
                    'created_by' => $company->owner_user_id,
                    'title' => $offerData['title'],
                    'description' => "Nous recherchons un {$offerData['title']} motivé pour rejoindre notre équipe. Vous participerez activement à nos projets et contribuerez à notre croissance. Environnement dynamique, équipe bienveillante, projets variés.",
                    'offer_type' => $offerData['offer_type'],
                    'duration_text' => $offerData['duration_text'],
                    'remote' => $offerData['remote'],
                    'city' => $offerData['city'],
                    'country' => 'Madagascar',
                    'salary_min' => $offerData['salary_min'],
                    'salary_max' => $offerData['salary_max'],
                    'currency' => 'Ar',
                    'criteria' => json_encode($offerData['criteria']),
                    'status' => 'published',
                    'application_deadline' => now()->addDays(30),
                    'created_at' => now()->subDays(rand(1, 15)),
                ]
            );

            $this->command->info("✅ Offre créée : {$offerData['title']} @ {$company->name}");
        }

        $this->command->info('');
        $this->command->info('🎉 10 entreprises + 12 offres créées avec succès !');
        $this->command->info('');
        $this->command->info('📧 Comptes entreprises :');
        $this->command->info('   demo.company1@talentshare.test → demo.company10@talentshare.test');
        $this->command->info('   Mot de passe : password');
    }
}