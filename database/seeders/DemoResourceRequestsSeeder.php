<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\ResourceRequest;
use App\Models\ResourceRequestLike;
use App\Models\ResourceRequestComment;
use App\Models\Notification;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoResourceRequestsSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================================
        // 1. RÉCUPÉRER LES ENTREPRISES
        // ============================================================
        $companies = Company::all();

        if ($companies->isEmpty()) {
            $this->command->error('❌ Aucune entreprise. Lance DemoCompaniesAndOffersSeeder d\'abord.');
            return;
        }

        // ============================================================
        // 2. RÉCUPÉRER LES TALENTS
        // ============================================================
        $talents = User::whereIn('role', ['employee', 'student'])->get();

        // ============================================================
        // 3. CRÉER LES SKILLS (avec slug + position obligatoires)
        // ============================================================
        $skillsPool = [
            'React', 'Vue', 'Angular', 'Node.js', 'Laravel', 'Python', 'PHP',
            'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS',
            'Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'After Effects',
            'SEO', 'Google Ads', 'Facebook Ads', 'Content Writing', 'Copywriting',
            'Data Analysis', 'Machine Learning', 'Power BI', 'Tableau', 'Excel',
            'Marketing', 'Communication', 'Community Management', 'Growth Hacking',
            'Sales', 'Business Development', 'Product Management', 'Scrum',
            'Flutter', 'React Native', 'Swift', 'Kotlin', 'TypeScript', 'GraphQL',
            'Tailwind', 'Bootstrap', 'Sass', 'Webflow', 'WordPress',
        ];

        $skills = collect($skillsPool)->map(function ($name, $index) {
            $slug = Str::slug($name);

            // Chercher par slug (unique)
            $existing = Skill::where('slug', $slug)->first();
            if ($existing) return $existing;

            return Skill::create([
                'name'              => $name,
                'slug'              => $slug,
                'position'          => $index + 1,
                'skill_category_id' => null,
                'description'       => null,
            ]);
        });

        $this->command->info("✅ " . $skills->count() . " compétences disponibles");

        // ============================================================
        // 4. DEMANDES POUR ENTREPRISES
        //    ⚠️ Colonnes OBLIGATOIRES d'après la BD :
        //    - start_at, end_at (NOT NULL)
        //    - workload_percent (NOT NULL)
        //    - remote (NOT NULL)
        //    - status (NOT NULL)
        //    - positions_count (NOT NULL)
        //    - urgency (NOT NULL)
        //    - views_count, proposals_count, shares_count (NOT NULL)
        //    - author_type (NOT NULL)
        // ============================================================
        $templates = [
            [
                'title' => 'Développeur React expérimenté',
                'description' => "Nous recherchons un développeur React senior pour renforcer notre équipe front-end. Vous travaillerez sur des projets clients variés.",
                'budget_min' => 500, 'budget_max' => 800,
                'skills' => ['React', 'TypeScript', 'Tailwind'],
            ],
            [
                'title' => 'Data Scientist freelance',
                'description' => "Mission de 3 mois pour construire un modèle de prédiction. Expérience Python / TensorFlow requise.",
                'budget_min' => 700, 'budget_max' => 1200,
                'skills' => ['Python', 'Machine Learning', 'Data Analysis'],
            ],
            [
                'title' => 'Designer UI/UX pour app mobile',
                'description' => "Refonte complète de notre application mobile. Portfolio requis.",
                'budget_min' => 400, 'budget_max' => 700,
                'skills' => ['Figma', 'Adobe XD'],
            ],
            [
                'title' => 'Développeur Node.js backend',
                'description' => "Construction d'une API REST performante. Stack : Node.js, Express, PostgreSQL, Docker.",
                'budget_min' => 600, 'budget_max' => 900,
                'skills' => ['Node.js', 'PostgreSQL', 'Docker'],
            ],
            [
                'title' => 'Expert SEO / Growth',
                'description' => "Audit technique, refonte sémantique, netlinking. Vous travaillerez avec notre équipe marketing.",
                'budget_min' => 300, 'budget_max' => 600,
                'skills' => ['SEO', 'Marketing', 'Google Ads'],
            ],
            [
                'title' => 'Community Manager temps partiel',
                'description' => "Gestion de nos réseaux sociaux. 15h/semaine, télétravail possible.",
                'budget_min' => 200, 'budget_max' => 350,
                'skills' => ['Community Management', 'Marketing'],
            ],
            [
                'title' => 'Développeur Flutter',
                'description' => "Développement d'une app mobile cross-platform. Stack : Flutter, Dart, Firebase.",
                'budget_min' => 500, 'budget_max' => 800,
                'skills' => ['Flutter', 'React Native'],
            ],
            [
                'title' => 'Ingénieur DevOps',
                'description' => "Mise en place d'une infrastructure cloud : CI/CD, monitoring, scalabilité. AWS, Kubernetes, Terraform.",
                'budget_min' => 800, 'budget_max' => 1400,
                'skills' => ['AWS', 'Kubernetes', 'Docker'],
            ],
        ];

        $createdRequests = [];

        foreach ($templates as $i => $tpl) {
            $company = $companies[$i % $companies->count()];

            $request = ResourceRequest::create([
                'company_id'       => $company->id,
                'created_by'       => $company->owner_user_id,
                'author_type'      => 'company',
                'title'            => $tpl['title'],
                'description'      => $tpl['description'],
                'start_at'         => now()->addDays(rand(5, 20))->toDateString(),
                'end_at'           => now()->addDays(rand(60, 180))->toDateString(),
                'workload_percent' => rand(0, 1) === 1 ? 100 : 50,
                'remote'           => rand(0, 1) === 1,
                'country'          => $company->country ?? 'Madagascar',
                'city'             => $company->city ?? 'Antananarivo',
                'status'           => 'published',
                'expires_at'       => now()->addDays(60)->toDateString(),
                'budget_min'       => $tpl['budget_min'],
                'budget_max'       => $tpl['budget_max'],
                'positions_count'  => rand(1, 3),
                'urgency'          => rand(0, 3) === 0 ? 'urgent' : 'normal',
                'tags'             => json_encode(['Tech', 'Remote']),
                'views_count'      => rand(20, 200),
                'proposals_count'  => 0,
                'shares_count'     => 0,
            ]);

            // Attacher compétences
            $skillIds = collect($tpl['skills'])->map(function ($name) {
                return Skill::where('slug', Str::slug($name))->first()?->id;
            })->filter();

            $request->skills()->sync(
                $skillIds->mapWithKeys(fn ($id) => [$id => ['min_level' => 'intermediate']])->toArray()
            );

            $createdRequests[] = $request;
            $this->command->info("✅ Demande : {$request->title} @ {$company->name}");
        }

        // ============================================================
        // 5. DEMANDES DE TALENTS
        // ============================================================
        if ($talents->isNotEmpty()) {
            $talentTemplates = [
                [
                    'title' => 'Talent dispo : Développeur Fullstack',
                    'description' => "3 ans d'expérience, dispo pour missions freelance ou CDI. React, Node.js, PostgreSQL.",
                    'skills' => ['React', 'Node.js', 'PostgreSQL'],
                ],
                [
                    'title' => 'Talent dispo : Data Analyst',
                    'description' => "Expert Python, SQL et Power BI. Dispo pour missions courtes ou longues.",
                    'skills' => ['Python', 'Power BI', 'Data Analysis'],
                ],
                [
                    'title' => 'Talent dispo : Designer UI/UX',
                    'description' => "5 ans d'expérience. Spécialisé apps mobiles et SaaS. Portfolio dispo.",
                    'skills' => ['Figma', 'Adobe XD'],
                ],
            ];

            foreach ($talentTemplates as $i => $tpl) {
                $talent = $talents[$i % $talents->count()];

                $request = ResourceRequest::create([
                    'company_id'       => null,
                    'created_by'       => $talent->id,
                    'author_type'      => 'talent',
                    'title'            => $tpl['title'],
                    'description'      => $tpl['description'],
                    'start_at'         => now()->addDays(rand(5, 15))->toDateString(),
                    'end_at'           => now()->addDays(rand(90, 180))->toDateString(),
                    'workload_percent' => 100,
                    'remote'           => true,
                    'country'          => 'Madagascar',
                    'city'             => 'Antananarivo',
                    'status'           => 'published',
                    'expires_at'       => now()->addDays(60)->toDateString(),
                    'budget_min'       => 400,
                    'budget_max'       => 700,
                    'positions_count'  => 1,
                    'urgency'          => 'normal',
                    'views_count'      => rand(10, 80),
                    'proposals_count'  => 0,
                    'shares_count'     => 0,
                ]);

                $skillIds = collect($tpl['skills'])->map(function ($name) {
                    return Skill::where('slug', Str::slug($name))->first()?->id;
                })->filter();

                $request->skills()->sync(
                    $skillIds->mapWithKeys(fn ($id) => [$id => ['min_level' => 'intermediate']])->toArray()
                );

                $createdRequests[] = $request;
                $this->command->info("✅ Talent : {$request->title} @ {$talent->name}");
            }
        }

        // ============================================================
        // 6. LIKES + COMMENTAIRES + NOTIFICATIONS
        // ============================================================
        $allUsers = User::all();

        foreach ($createdRequests as $request) {
            // Likes (3 à 15)
            $likeCount = rand(3, 15);
            $likers = $allUsers->random(min($likeCount, $allUsers->count()));
            foreach ($likers as $liker) {
                if ($liker->id === $request->created_by) continue;
                ResourceRequestLike::firstOrCreate([
                    'resource_request_id' => $request->id,
                    'user_id' => $liker->id,
                ]);
            }

            // Commentaires (1 à 5)
            $commentCount = rand(1, 5);
            $commenters = $allUsers->random(min($commentCount, $allUsers->count()));
            $texts = [
                "Très intéressant, je vais postuler !",
                "Le projet correspond à mon profil.",
                "Bonne chance à tous 🙌",
                "Le télétravail complet est-il possible ?",
                "Super opportunité, merci pour le partage !",
                "Je recommande ce type de mission.",
            ];

            foreach ($commenters as $commenter) {
                if ($commenter->id === $request->created_by) continue;
                ResourceRequestComment::create([
                    'resource_request_id' => $request->id,
                    'user_id' => $commenter->id,
                    'content' => $texts[array_rand($texts)],
                    'created_at' => now()->subHours(rand(1, 240)),
                ]);
            }

            // Notification
            if ($request->created_by) {
                Notification::create([
                    'user_id' => $request->created_by,
                    'type' => 'request_liked',
                    'title' => '❤️ Nouveau J\'aime',
                    'body' => "Quelqu'un a aimé votre demande « {$request->title} »",
                    'subject_type' => ResourceRequest::class,
                    'subject_id' => $request->id,
                    'data' => json_encode([
                        'url' => "/resource-requests/{$request->id}",
                        'request_id' => $request->id,
                    ]),
                    'created_at' => now()->subMinutes(rand(5, 1440)),
                ]);
            }
        }

        $this->command->info('');
        $this->command->info('🎉 ' . count($createdRequests) . ' demandes créées avec likes + commentaires + notifications !');
    }
}