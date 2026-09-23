<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\UniversityController;
use App\Http\Controllers\Api\ProfessionalProfileController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ResourceOfferController;
use App\Http\Controllers\Api\ResourceRequestController;
use App\Http\Controllers\Api\ProposalController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\JobOfferController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\VerificationRequestController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\Admin\VerificationController as AdminVerificationController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ProfileSectionController;
use App\Http\Controllers\Api\SavedSearchController;
use App\Http\Controllers\Api\MatchInteractionController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\EducationController;
use Illuminate\Support\Facades\Route;


// =============================================
// ROUTES PUBLIQUES
// =============================================

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])->middleware('throttle:3,1');
Route::post('/reset-password', [PasswordResetController::class, 'reset']);

// Entreprises (public)
Route::get('/companies', [CompanyController::class, 'index']);
Route::get('/companies/{company}', [CompanyController::class, 'show'])->where('company', '[0-9]+');

// Universités
Route::get('/universities', [UniversityController::class, 'index']);
Route::get('/universities/{university}', [UniversityController::class, 'show']);

// ✅ P0-8 : Recherche avancée (DOIT ÊTRE AVANT /professional-profiles/{id})
Route::get('/talents/search', [ProfessionalProfileController::class, 'search']);

// Profils professionnels (publics)
Route::get('/professional-profiles', [ProfessionalProfileController::class, 'index']);
Route::get('/professional-profiles/{professionalProfile}', [ProfessionalProfileController::class, 'show']);

// Compétences (référentiel)
Route::get('/skill-categories', [SkillController::class, 'categories']);
Route::get('/skills/stats', [SkillController::class, 'stats']);
Route::get('/skills', [SkillController::class, 'index']);

// Référentiel langues (public)
Route::get('/languages', function () {
    return \App\Models\Language::select('name')
        ->distinct()
        ->orderBy('name')
        ->pluck('name');
});

// Resource Offers (public)
Route::get('/resource-offers', [ResourceOfferController::class, 'index']);

// Resource Requests (public — liste + détail)
Route::get('/resource-requests', [ResourceRequestController::class, 'index']);
Route::get('/resource-requests/{resourceRequest}', [ResourceRequestController::class, 'show']);

// Job Offers (public)
Route::get('/job-offers', [JobOfferController::class, 'index']);
Route::get('/job-offers/{jobOffer}', [JobOfferController::class, 'show']);

// ✅ Matching (P0-10)
Route::post('/match/explain', [MatchController::class, 'explain']);


// =============================================
// ROUTES PROTÉGÉES
// =============================================

Route::middleware('auth:sanctum')->group(function () {

    // === Auth ===
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // === Entreprise ===
    // ⚠️ ORDRE CRITIQUE : "me" AVANT "{company}"
    Route::get   ('/companies/me',                                    [CompanyController::class, 'me']);
    Route::get   ('/companies/me/employees',                          [CompanyController::class, 'myEmployees']);
    Route::get   ('/companies/my/all',                                [CompanyController::class, 'myCompanies']);

    Route::post  ('/companies',                                       [CompanyController::class, 'store']);
    Route::patch ('/companies/{company}',                             [CompanyController::class, 'update']);
    Route::post  ('/companies/{company}/logo',                        [CompanyController::class, 'uploadLogo']);
    Route::post  ('/companies/{company}/members',                     [CompanyController::class, 'addMember']);
    Route::delete('/companies/{company}/members/{member}',            [CompanyController::class, 'removeMember']);
    Route::get   ('/companies/{company}/members',                     [CompanyController::class, 'members']);
    Route::post  ('/companies/{company}/verify',                      [CompanyController::class, 'requestVerification']);
    Route::get   ('/companies/{company}/employees',                   [CompanyController::class, 'employees']);
    Route::post  ('/companies/{company}/employees',                   [CompanyController::class, 'addEmployee']);
    Route::delete('/companies/{company}/employees/{employee}',        [CompanyController::class, 'removeEmployee']);

    // === Universités ===
    Route::post('/universities', [UniversityController::class, 'store']);
    Route::patch('/universities/{university}', [UniversityController::class, 'update']);

    // === Profil professionnel ===
    Route::get('/profile/me', [ProfessionalProfileController::class, 'me']);
    Route::post('/profile', [ProfessionalProfileController::class, 'store']);
    Route::patch('/profile/visibility', [ProfessionalProfileController::class, 'updateVisibility']);
    Route::patch('/professional-profiles/{professionalProfile}', [ProfessionalProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfessionalProfileController::class, 'uploadAvatar']);
    Route::post('/profile/cv', [ProfessionalProfileController::class, 'uploadCv']);

    // === Expériences / Formations / Certifs / Langues ===
    Route::post('/experiences', [ProfileSectionController::class, 'storeExperience']);
    Route::patch('/experiences/{experience}', [ProfileSectionController::class, 'updateExperience']);
    Route::delete('/experiences/{experience}', [ProfileSectionController::class, 'destroyExperience']);
    Route::post('/educations', [ProfileSectionController::class, 'storeEducation']);
    Route::patch('/educations/{education}', [ProfileSectionController::class, 'updateEducation']);
    Route::delete('/educations/{education}', [ProfileSectionController::class, 'destroyEducation']);
    Route::post('/certifications', [ProfileSectionController::class, 'storeCertification']);
    Route::patch('/certifications/{certification}', [ProfileSectionController::class, 'updateCertification']);
    Route::delete('/certifications/{certification}', [ProfileSectionController::class, 'destroyCertification']);
    Route::post('/languages', [ProfileSectionController::class, 'storeLanguage']);
    Route::patch('/languages/{language}', [ProfileSectionController::class, 'updateLanguage']);
    Route::delete('/languages/{language}', [ProfileSectionController::class, 'destroyLanguage']);

    // === Compétences ===
    Route::post('/skills', [SkillController::class, 'store']);
    Route::post('/skills/attach', [SkillController::class, 'attach']);
    Route::patch('/skills/{skill}/level', [SkillController::class, 'updateLevel']);
    Route::delete('/skills/{skill}/detach', [SkillController::class, 'detach']);

    // === Disponibilités ===
    Route::get('/availability', [AvailabilityController::class, 'index']);
    Route::post('/availability/check-overlap', [AvailabilityController::class, 'checkOverlap']);
    Route::post('/availability', [AvailabilityController::class, 'store']);
    Route::patch('/availability/{availabilityWindow}', [AvailabilityController::class, 'update']);
    Route::delete('/availability/{availabilityWindow}', [AvailabilityController::class, 'destroy']);

    // === Portfolio ===
    Route::get('/portfolio/my', [PortfolioController::class, 'myPortfolio']);
    Route::post('/portfolio', [PortfolioController::class, 'store']);
    Route::patch('/portfolio', [PortfolioController::class, 'update']);
    Route::post('/portfolio/projects', [PortfolioController::class, 'addProject']);
    Route::patch('/portfolio/projects/{project}', [PortfolioController::class, 'updateProject']);
    Route::delete('/portfolio/projects/{project}', [PortfolioController::class, 'deleteProject']);
    Route::patch('/portfolio/visibility', [PortfolioController::class, 'updateVisibility']);

    // === Resource Offers (protégés) ===
    Route::get('/resource-offers/my', [ResourceOfferController::class, 'my']);
    Route::post('/resource-offers', [ResourceOfferController::class, 'store']);
    Route::patch('/resource-offers/{resourceOffer}', [ResourceOfferController::class, 'update']);
    Route::delete('/resource-offers/{resourceOffer}', [ResourceOfferController::class, 'destroy']);

    // =============================================
    // ✅ P0-9 : RESOURCE REQUESTS (complet)
    // =============================================
    Route::get   ('/resource-requests/my',                            [ResourceRequestController::class, 'index']);
    Route::post  ('/resource-requests',                                [ResourceRequestController::class, 'store']);

    // ⚠️ /candidates AVANT /{resourceRequest}
    Route::get   ('/resource-requests/{resourceRequest}/candidates',   [ResourceRequestController::class, 'candidates']);

    Route::patch ('/resource-requests/{resourceRequest}',              [ResourceRequestController::class, 'update']);
    Route::delete('/resource-requests/{resourceRequest}',              [ResourceRequestController::class, 'destroy']);

    // Actions de statut
    Route::post  ('/resource-requests/{resourceRequest}/publish',      [ResourceRequestController::class, 'publish']);
    Route::post  ('/resource-requests/{resourceRequest}/pause',        [ResourceRequestController::class, 'pause']);
    Route::post  ('/resource-requests/{resourceRequest}/close',        [ResourceRequestController::class, 'close']);
    Route::post  ('/resource-requests/{resourceRequest}/mark-filled',  [ResourceRequestController::class, 'markFilled']);
    Route::post  ('/resource-requests/{resourceRequest}/duplicate',    [ResourceRequestController::class, 'duplicate']);

    // =============================================
    // ✅ P0-11 : PROPOSITIONS (complet)
    // ⚠️ ORDRE CRITIQUE : /received et /sent AVANT /{proposal}
    // =============================================
    Route::get   ('/proposals/received',              [ProposalController::class, 'received']);
    Route::get   ('/proposals/sent',                  [ProposalController::class, 'sent']);

    Route::post  ('/proposals',                       [ProposalController::class, 'store']);
    Route::get   ('/proposals/{proposal}',            [ProposalController::class, 'show']);
    Route::patch ('/proposals/{proposal}',            [ProposalController::class, 'update']);
    Route::post  ('/proposals/{proposal}/submit',     [ProposalController::class, 'submit']);
    Route::post  ('/proposals/{proposal}/cancel',     [ProposalController::class, 'cancel']);
    Route::post  ('/proposals/{proposal}/accept',     [ProposalController::class, 'accept']);
    Route::post  ('/proposals/{proposal}/decline',    [ProposalController::class, 'decline']);

    // === Missions ===
    Route::get   ('/missions',                   [MissionController::class, 'index']);
    Route::post  ('/missions',                   [MissionController::class, 'store']);
    Route::get   ('/missions/{mission}',         [MissionController::class, 'show']);
    Route::post  ('/missions/{mission}/accept',  [MissionController::class, 'accept']);
    Route::post  ('/missions/{mission}/decline', [MissionController::class, 'decline']);
    Route::patch ('/missions/{mission}/status',  [MissionController::class, 'updateStatus']);

    // === Offres d'emploi ===
    Route::post('/job-offers', [JobOfferController::class, 'store']);
    Route::patch('/job-offers/{jobOffer}', [JobOfferController::class, 'update']);
    Route::delete('/job-offers/{jobOffer}', [JobOfferController::class, 'destroy']);
    Route::get('/job-offers/{jobOffer}/applications', [JobOfferController::class, 'applications']);

    // === Candidatures ===
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);

    // === Dashboard ===
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // === Messagerie ===
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);

    // === Notifications ===
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // === Évaluations ===
    Route::post('/missions/{mission}/ratings', [RatingController::class, 'store']);
    Route::get('/missions/{mission}/ratings', [RatingController::class, 'index']);

    // === Vérifications ===
    Route::post('/verification-requests', [VerificationRequestController::class, 'store']);

    // === Documents ===
        // === Documents ===
    Route::post  ('/documents',                 [DocumentController::class, 'upload']);
    Route::get   ('/documents',                 [DocumentController::class, 'index']);
    Route::get   ('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::delete('/documents/{document}',      [DocumentController::class, 'destroy']);
    // === Email ===
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed')->name('verification.verify');
    Route::post('/email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:3,1');

    // === Compte ===
    Route::patch('/account', [AccountController::class, 'update']);
    Route::patch('/account/password', [AccountController::class, 'changePassword']);
    Route::post('/account/deactivate', [AccountController::class, 'deactivate']);
    Route::delete('/account', [AccountController::class, 'destroy']);
    Route::patch('/account/profile', [AccountController::class, 'updateProfile']);
Route::patch('/account/preferences', [AccountController::class, 'updatePreferences']);

    // === Recherche utilisateur ===
    Route::get('/users/search', [UserController::class, 'search']);

    // =============================================
    // ✅ P0-8 : RECHERCHES SAUVEGARDÉES + MATCHING
    // =============================================
    Route::get   ('/saved-searches',                   [SavedSearchController::class, 'index']);
    Route::post  ('/saved-searches',                   [SavedSearchController::class, 'store']);
    Route::patch ('/saved-searches/{savedSearch}',     [SavedSearchController::class, 'update']);
    Route::delete('/saved-searches/{savedSearch}',     [SavedSearchController::class, 'destroy']);
    Route::get   ('/saved-searches/{savedSearch}/run', [SavedSearchController::class, 'run']);
    Route::post  ('/match-interactions',               [MatchInteractionController::class, 'store']);
 Route::apiResource('educations', EducationController::class);
    });


// =============================================
// ROUTES ADMIN
// =============================================

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/verification-requests', [AdminVerificationController::class, 'index']);
    Route::patch('/verification-requests/{verificationRequest}/review', [AdminVerificationController::class, 'review']);
});


// =============================================
// ROUTES PUBLIQUES DYNAMIQUES (À LA FIN)
// =============================================

Route::get('/resource-offers/{resourceOffer}', [ResourceOfferController::class, 'show']);
Route::get('/portfolio/{slug}', [PortfolioController::class, 'show']);