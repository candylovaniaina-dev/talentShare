<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /* 1. Enrichissement de la table universities (colonnes ajoutées seulement si absentes) */
        $add = [
            'user_id'        => fn (Blueprint $t) => $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete(),
            'name'           => fn (Blueprint $t) => $t->string('name')->default(''),
            'type'           => fn (Blueprint $t) => $t->string('type', 30)->nullable(),
            'description'    => fn (Blueprint $t) => $t->text('description')->nullable(),
            'address'        => fn (Blueprint $t) => $t->string('address')->nullable(),
            'city'           => fn (Blueprint $t) => $t->string('city', 120)->nullable(),
            'region'         => fn (Blueprint $t) => $t->string('region', 120)->nullable(),
            'country'        => fn (Blueprint $t) => $t->string('country', 80)->nullable(),
            'latitude'       => fn (Blueprint $t) => $t->decimal('latitude', 10, 7)->nullable(),
            'longitude'      => fn (Blueprint $t) => $t->decimal('longitude', 10, 7)->nullable(),
            'phone'          => fn (Blueprint $t) => $t->string('phone', 40)->nullable(),
            'contact_email'  => fn (Blueprint $t) => $t->string('contact_email')->nullable(),
            'website'        => fn (Blueprint $t) => $t->string('website')->nullable(),
            'logo_path'      => fn (Blueprint $t) => $t->string('logo_path')->nullable(),
            'founded_year'   => fn (Blueprint $t) => $t->unsignedSmallInteger('founded_year')->nullable(),
            'accreditation'  => fn (Blueprint $t) => $t->string('accreditation')->nullable(),
        ];
        foreach ($add as $col => $def) {
            if (! Schema::hasColumn('universities', $col)) {
                Schema::table('universities', fn (Blueprint $t) => $def($t));
            }
        }

        /* 2. Équipe de l'établissement (P0-1) */
        Schema::create('university_members', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('name');
            $t->string('email');
            $t->string('role', 30)->default('internship_office'); // admin | internship_office | teacher | viewer
            $t->string('status', 20)->default('active');          // active | revoked
            $t->timestamps();
            $t->unique(['university_id', 'email']);
        });

        /* 3. Offre académique (P0-16) */
        Schema::create('university_departments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $t->string('name');
            $t->string('code', 30)->nullable();
            $t->string('head_name')->nullable();
            $t->text('description')->nullable();
            $t->timestamps();
        });

        Schema::create('university_programs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $t->foreignId('department_id')->nullable()->constrained('university_departments')->nullOnDelete();
            $t->string('name');
            $t->string('level', 30)->nullable();
            $t->unsignedTinyInteger('duration_years')->nullable();
            $t->text('description')->nullable();
            $t->json('skills')->nullable();
            $t->timestamps();
        });

        /* 4. Étudiants référencés (P0-13 / P0-22) */
        Schema::create('university_students', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('program_id')->nullable()->constrained('university_programs')->nullOnDelete();
            $t->string('student_number', 60)->nullable();
            $t->string('full_name');
            $t->string('email')->nullable();
            $t->string('level', 30)->nullable();
            $t->string('academic_year', 20)->nullable();
            $t->unsignedSmallInteger('graduation_year')->nullable();
            $t->string('verification_status', 20)->default('pending'); // pending | verified | rejected
            $t->timestamp('verified_at')->nullable();
            $t->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $t->text('verification_note')->nullable();
            $t->string('origin', 20)->default('university');           // university | student | import
            $t->string('placement_status', 30)->default('searching');  // searching | internship | employed | continuing | unavailable
            $t->foreignId('placement_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $t->string('placement_company_name')->nullable();
            $t->string('placement_title')->nullable();
            $t->date('placement_start')->nullable();
            $t->timestamps();
            $t->unique(['university_id', 'user_id']);
            $t->index(['university_id', 'verification_status']);
        });

        /* 5. Partenariats Université <-> Entreprise */
        Schema::create('university_partnerships', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $t->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $t->string('status', 20)->default('pending');          // pending | active | declined | ended
            $t->string('initiated_by', 20)->default('university'); // university | company
            $t->text('message')->nullable();
            $t->text('notes')->nullable();
            $t->timestamp('started_at')->nullable();
            $t->timestamp('ended_at')->nullable();
            $t->timestamps();
            $t->unique(['university_id', 'company_id']);
        });

        /* 6. Offres diffusées aux étudiants */
        Schema::create('university_opportunities', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $t->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $t->unsignedBigInteger('job_offer_id')->nullable();
            $t->foreignId('program_id')->nullable()->constrained('university_programs')->nullOnDelete();
            $t->string('title');
            $t->string('type', 30)->default('stage'); // stage | alternance | premier_emploi | autre
            $t->text('description')->nullable();
            $t->date('deadline')->nullable();
            $t->string('status', 20)->default('published'); // draft | published | closed
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        /* 7. Conventions de stage (P0-23 : structure documentaire) */
        Schema::create('university_conventions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $t->foreignId('student_id')->constrained('university_students')->cascadeOnDelete();
            $t->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $t->unsignedBigInteger('job_offer_id')->nullable();
            $t->unsignedBigInteger('mission_id')->nullable();
            $t->string('title');
            $t->string('type', 30)->default('internship'); // internship | alternance | tripartite | other
            $t->string('status', 20)->default('draft');    // draft | to_sign | signed | archived
            $t->date('start_date')->nullable();
            $t->date('end_date')->nullable();
            $t->string('academic_tutor')->nullable();
            $t->string('company_tutor')->nullable();
            $t->string('document_path')->nullable();
            $t->text('notes')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach ([
            'university_conventions', 'university_opportunities', 'university_partnerships',
            'university_students', 'university_programs', 'university_departments', 'university_members',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
