<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\SkillCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SkillCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            'Informatique' => [
                'icon' => '💻',
                'children' => [
                    'Développement Web' => [
                        'Laravel', 'React', 'Vue.js', 'Node.js', 'PHP', 'JavaScript',
                        'TypeScript', 'HTML/CSS', 'Tailwind CSS', 'Next.js',
                    ],
                    'Développement Mobile' => [
                        'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS',
                    ],
                    'Bases de données' => [
                        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
                    ],
                    'DevOps & Cloud' => [
                        'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud',
                        'CI/CD', 'Linux', 'Nginx', 'Terraform',
                    ],
                    'Cybersécurité' => [
                        'Pentesting', 'Sécurité réseau', 'Cryptographie', 'OWASP', 'SOC',
                    ],
                ],
            ],
            'Data & IA' => [
                'icon' => '🤖',
                'children' => [
                    'Data Science' => ['Python', 'Pandas', 'NumPy', 'Jupyter', 'R', 'Statistiques'],
                    'Machine Learning' => ['Scikit-learn', 'TensorFlow', 'PyTorch', 'XGBoost', 'NLP', 'Computer Vision'],
                    'Data Engineering' => ['ETL', 'Airflow', 'Spark', 'Kafka', 'dbt', 'Snowflake'],
                    'Business Intelligence' => ['Power BI', 'Tableau', 'Looker', 'Metabase', 'Excel avancé'],
                ],
            ],
            'Finance & Comptabilité' => [
                'icon' => '💰',
                'children' => [
                    'Comptabilité' => ['Comptabilité générale', 'Comptabilité analytique', 'Audit', 'Fiscalité', 'SYSCOHADA'],
                    'Finance' => ['Analyse financière', 'Modélisation financière', 'Trésorerie', 'Évaluation', 'M&A'],
                    'Contrôle de gestion' => ['Budget', 'Reporting', 'KPI', 'Costing', 'Prévisions'],
                ],
            ],
            'Marketing & Communication' => [
                'icon' => '📢',
                'children' => [
                    'Marketing digital' => ['SEO', 'SEA', 'Réseaux sociaux', 'Content Marketing', 'Email Marketing', 'Google Ads'],
                    'Communication' => ['Rédaction', 'Relations presse', 'Événementiel', 'Branding', 'Storytelling'],
                    'Design' => ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'UI Design', 'UX Design', 'Canva'],
                ],
            ],
            'Ressources Humaines' => [
                'icon' => '👥',
                'children' => [
                    'Recrutement' => ['Sourcing', 'Entretiens', 'Onboarding', 'ATS', 'LinkedIn Recruiter'],
                    'Gestion RH' => ['Paie', 'Droit du travail', 'Formation', 'GPEC', 'SIRH'],
                ],
            ],
            'Génie civil & BTP' => [
                'icon' => '🏗️',
                'children' => [
                    'Conception' => ['AutoCAD', 'Revit', 'SketchUp', 'BIM', 'Dessin technique'],
                    'Chantier' => ['Gestion de chantier', 'Topographie', 'Béton armé', 'HSE', 'Planning'],
                ],
            ],
            'Agriculture & Environnement' => [
                'icon' => '🌱',
                'children' => [
                    'Production agricole' => ['Agronomie', 'Irrigation', 'Permaculture', 'Élevage', 'Phytosanitaire'],
                    'Environnement' => ['Étude d\'impact', 'Développement durable', 'Gestion des déchets', 'Énergies renouvelables'],
                ],
            ],
            'Télécommunications' => [
                'icon' => '📡',
                'children' => [
                    'Réseaux' => ['TCP/IP', 'Cisco', 'Fibre optique', '4G/5G', 'VSAT', 'VoIP'],
                ],
            ],
            'Gestion de projet' => [
                'icon' => '📊',
                'children' => [
                    'Méthodologies' => ['Agile', 'Scrum', 'Kanban', 'PRINCE2', 'PMP', 'Lean'],
                    'Outils' => ['Jira', 'Trello', 'Notion', 'Asana', 'Monday.com'],
                ],
            ],
            'Langues' => [
                'icon' => '🌍',
                'children' => [
                    'Langues étrangères' => ['Anglais', 'Français', 'Espagnol', 'Allemand', 'Chinois', 'Arabe', 'Malagasy'],
                ],
            ],
        ];

        $rootPos = 0;
        foreach ($tree as $rootName => $rootData) {
            $root = SkillCategory::updateOrCreate(
                ['slug' => Str::slug($rootName)],
                [
                    'name'     => $rootName,
                    'icon'     => $rootData['icon'] ?? null,
                    'position' => $rootPos++,
                ]
            );

            $childPos = 0;
            foreach ($rootData['children'] as $subName => $skills) {
                $sub = SkillCategory::updateOrCreate(
                    ['slug' => Str::slug($rootName . '-' . $subName)],
                    [
                        'name'      => $subName,
                        'parent_id' => $root->id,
                        'position'  => $childPos++,
                    ]
                );

                $skillPos = 0;
                foreach ($skills as $skillName) {
                    // ✅ Vérifier PAR NOM (pas par slug) pour éviter les conflits
                    $skill = Skill::where('name', $skillName)->first();

                    if ($skill) {
                        // Si le skill existe déjà mais sans catégorie, on la lui assigne
                        if (!$skill->skill_category_id) {
                            $skill->update([
                                'skill_category_id' => $sub->id,
                                'position'          => $skillPos,
                            ]);
                        }
                        $skillPos++;
                        continue;
                    }

                    // ✅ Créer le skill si vraiment absent
                    $slug = Str::slug($skillName);
                    $original = $slug;
                    $i = 1;
                    while (Skill::where('slug', $slug)->exists()) {
                        $slug = $original . '-' . $i++;
                    }

                    Skill::create([
                        'name'              => $skillName,
                        'slug'              => $slug,
                        'skill_category_id' => $sub->id,
                        'position'          => $skillPos++,
                    ]);
                }
            }
        }

        $this->command->info('✅ SkillCategorySeeder terminé avec succès.');
    }
}