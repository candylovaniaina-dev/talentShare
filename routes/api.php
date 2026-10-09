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

Route::get('/companies', [CompanyController::class, 'index']);
Route::get('/companies/{company}', [CompanyController::class, 'show'])->where('company', '[0-9]+');

Route::get('/universities', [UniversityController::class, 'index']);
Route::get('/universities/{university}', [UniversityController::class, 'show']);

Route::get('/talents/search', [ProfessionalProfileController::class, 'search']);

Route::get('/professional-profiles', [ProfessionalProfileController::class, 'index']);
Route::get('/professional-profiles/{professionalProfile}', [ProfessionalProfileController::class, 'show']);

Route::get('/skill-categories', [SkillController::class, 'categories']);
Route::get('/skills/stats', [SkillController::class, 'stats']);
Route::get('/skills', [SkillController::class, 'index']);

Route::get('/languages', function () {
    return \App\Models\Language::select('name')
        ->distinct()
        ->orderBy('name')
        ->pluck('name');
});

Route::get('/resource-offers', [ResourceOfferController::class, 'index']);

// ✅ FIX : contrainte numérique pour ne pas capturer "new"
Route::get('/resource-requests', [ResourceRequestController::class, 'index']);
Route::get('/resource-requests/{resourceRequest}', [ResourceRequestController::class, 'show'])
    ->where('resourceRequest', '[0-9]+');

Route::get('/job-offers/my', [JobOfferController::class, 'my'])->middleware('auth:sanctum');
Route::get('/job-offers', [JobOfferController::class, 'index']);
Route::get('/job-offers/{jobOffer}', [JobOfferController::class, 'show']);

Route::post('/match/explain', [MatchController::class, 'explain']);


// =============================================
// ROUTES PROTÉGÉES
// =============================================

Route::middleware('auth:sanctum')->group(function () {

    // === Auth ===
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // === Entreprise ===
    Route::get   ('/companies/me',                                    [CompanyController::class, 'me']);
    Route::get   ('/companies/me/employees',                          [CompanyController::class, 'myEmployees']);
    Route::get   ('/companies/my/all',                                [CompanyController::class, 'myCompanies']);

    Route::post  ('/companies',                                       [CompanyController::class, 'store']);
    Route::patch ('/companies/{company}',                             [CompanyController::class, 'update']);
    Route::post  ('/companies/{company}/logo',                        [CompanyController::class, 'uploadLogo']);
    Route::delete('/companies/{company}/logo',                        [CompanyController::class, 'deleteLogo']);

    // Membres
    Route::get   ('/companies/{company}/members',                     [CompanyController::class, 'members']);
    Route::post  ('/companies/{company}/members',                     [CompanyController::class, 'addMember']);
    Route::post  ('/companies/{company}/members/{member}/photo',      [CompanyController::class, 'uploadMemberPhoto']);
    Route::delete('/companies/{company}/members/{member}',            [CompanyController::class, 'removeMember']);

    Route::post  ('/companies/{company}/verify',                      [CompanyController::class, 'requestVerification']);

    // Salariés
    Route::get   ('/companies/{company}/employees',                   [CompanyController::class, 'employees']);
    Route::post  ('/companies/{company}/employees',                   [CompanyController::class, 'addEmployee']);
    Route::post  ('/companies/{company}/employees/{employee}/photo',  [CompanyController::class, 'uploadEmployeePhoto']);
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
    Route::post('/profile/cover', [ProfessionalProfileController::class, 'uploadCover']);

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

    // === Resource Offers ===
    Route::get('/resource-offers/my', [ResourceOfferController::class, 'my']);
    Route::post('/resource-offers', [ResourceOfferController::class, 'store']);
    Route::patch('/resource-offers/{resourceOffer}', [ResourceOfferController::class, 'update'])
        ->where('resourceOffer', '[0-9]+');
    Route::delete('/resource-offers/{resourceOffer}', [ResourceOfferController::class, 'destroy'])
        ->where('resourceOffer', '[0-9]+');

    // === Resource Requests ===
   // === Resource Requests ===
Route::get   ('/resource-requests/my', [ResourceRequestController::class, 'index']);
Route::post  ('/resource-requests',    [ResourceRequestController::class, 'store']);

Route::get   ('/resource-requests/{resourceRequest}/candidates',   [ResourceRequestController::class, 'candidates'])
    ->where('resourceRequest', '[0-9]+');

Route::patch ('/resource-requests/{resourceRequest}',              [ResourceRequestController::class, 'update'])
    ->where('resourceRequest', '[0-9]+');

Route::delete('/resource-requests/{resourceRequest}',              [ResourceRequestController::class, 'destroy'])
    ->where('resourceRequest', '[0-9]+');

Route::post  ('/resource-requests/{resourceRequest}/publish',      [ResourceRequestController::class, 'publish'])
    ->where('resourceRequest', '[0-9]+');
Route::post  ('/resource-requests/{resourceRequest}/pause',        [ResourceRequestController::class, 'pause'])
    ->where('resourceRequest', '[0-9]+');
Route::post  ('/resource-requests/{resourceRequest}/close',        [ResourceRequestController::class, 'close'])
    ->where('resourceRequest', '[0-9]+');
Route::post  ('/resource-requests/{resourceRequest}/mark-filled',  [ResourceRequestController::class, 'markFilled'])
    ->where('resourceRequest', '[0-9]+');
Route::post  ('/resource-requests/{resourceRequest}/duplicate',    [ResourceRequestController::class, 'duplicate'])
    ->where('resourceRequest', '[0-9]+');
        Route::post('/resource-requests/{resourceRequest}/like',     [ResourceRequestController::class, 'toggleLike'])
        ->where('resourceRequest', '[0-9]+');
    Route::post('/resource-requests/{resourceRequest}/comment',  [ResourceRequestController::class, 'comment'])
        ->where('resourceRequest', '[0-9]+');
    Route::get ('/resource-requests/{resourceRequest}/comments', [ResourceRequestController::class, 'comments'])
        ->where('resourceRequest', '[0-9]+');
    Route::post('/resource-requests/{resourceRequest}/share',    [ResourceRequestController::class, 'share'])
        ->where('resourceRequest', '[0-9]+');
    // === Propositions ===
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

    // === JOB OFFERS ===
    Route::post  ('/job-offers',                        [JobOfferController::class, 'store']);
    Route::patch ('/job-offers/{jobOffer}',             [JobOfferController::class, 'update']);
    Route::delete('/job-offers/{jobOffer}',             [JobOfferController::class, 'destroy']);
    Route::get   ('/job-offers/{jobOffer}/applications',[JobOfferController::class, 'applications']);

    // Interactions sociales
    Route::post  ('/job-offers/{jobOffer}/like',        [JobOfferController::class, 'toggleLike']);
    Route::post  ('/job-offers/{jobOffer}/comment',     [JobOfferController::class, 'comment']);
    Route::get   ('/job-offers/{jobOffer}/comments',    [JobOfferController::class, 'comments']);
    Route::post  ('/job-offers/{jobOffer}/share',       [JobOfferController::class, 'share']);

    // === Candidatures ===
    Route::get   ('/applications',                       [ApplicationController::class, 'index']);
    Route::get   ('/applications/stats',                 [ApplicationController::class, 'stats']);
    Route::post  ('/applications',                       [ApplicationController::class, 'store']);
    Route::get   ('/applications/{application}',         [ApplicationController::class, 'show']);
    Route::delete('/applications/{application}',         [ApplicationController::class, 'withdraw']);
    Route::patch ('/applications/{application}/status',  [ApplicationController::class, 'updateStatus']);
    Route::post  ('/applications/{application}/schedule-interview', [ApplicationController::class, 'scheduleInterview']);
    Route::post  ('/applications/{application}/viewed',  [ApplicationController::class, 'markAsViewed']);

    // === Dashboard ===
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // === Messagerie ===
    Route::get   ('/conversations',                                       [ConversationController::class, 'index']);
    Route::get   ('/conversations/unread-count',                          [ConversationController::class, 'unreadCount']);
    Route::post  ('/conversations/direct',                                [ConversationController::class, 'createDirect']);
    Route::post  ('/conversations/group',                                 [ConversationController::class, 'createGroup']);
    Route::post  ('/conversations',                                       [ConversationController::class, 'store']);
    Route::get   ('/conversations/{conversation}',                        [ConversationController::class, 'show']);
    Route::get   ('/conversations/{conversation}/messages',               [ConversationController::class, 'messages']);
    Route::post  ('/conversations/{conversation}/messages',               [ConversationController::class, 'sendMessage']);
    Route::post  ('/conversations/{conversation}/mark-unread',            [ConversationController::class, 'markUnread']);
    Route::post  ('/conversations/{conversation}/archive',                [ConversationController::class, 'archive']);
    Route::post  ('/conversations/{conversation}/participants',           [ConversationController::class, 'addParticipant']);
    Route::delete('/conversations/{conversation}/participants/{userId}',  [ConversationController::class, 'removeParticipant']);
    Route::post  ('/conversations/{conversation}/leave',                  [ConversationController::class, 'leave']);
    Route::patch ('/conversations/{conversation}',                        [ConversationController::class, 'update']);
    Route::delete('/conversations/{conversation}',                        [ConversationController::class, 'destroy']);

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
    Route::get   ('/documents',                                            [DocumentController::class, 'index']);
    Route::post  ('/documents',                                            [DocumentController::class, 'upload']);
    Route::get   ('/documents/{document}',                                 [DocumentController::class, 'show']);
    Route::patch ('/documents/{document}',                                 [DocumentController::class, 'update']);
    Route::delete('/documents/{document}',                                 [DocumentController::class, 'destroy']);
    Route::post  ('/documents/{document}/versions',                        [DocumentController::class, 'uploadVersion']);
    Route::get   ('/documents/{document}/versions/{version}/download',     [DocumentController::class, 'downloadVersion']);
    Route::get   ('/documents/{document}/download',                        [DocumentController::class, 'download']);
    Route::get   ('/documents/{document}/history',                         [DocumentController::class, 'history']);
    Route::post  ('/documents/{document}/sign',                            [DocumentController::class, 'markAsSigned']);

    // === Email ===
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
    Route::get('/users/suggestions', [UserController::class, 'suggestions']);

    // === Recherches sauvegardées + Matching ===
    Route::get   ('/saved-searches',                   [SavedSearchController::class, 'index']);
    Route::post  ('/saved-searches',                   [SavedSearchController::class, 'store']);
    Route::patch ('/saved-searches/{savedSearch}',     [SavedSearchController::class, 'update']);
    Route::delete('/saved-searches/{savedSearch}',     [SavedSearchController::class, 'destroy']);
    Route::get   ('/saved-searches/{savedSearch}/run', [SavedSearchController::class, 'run']);
    Route::post  ('/match-interactions',               [MatchInteractionController::class, 'store']);

    // === Educations (API Resource) ===
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
// ROUTES PUBLIQUES DYNAMIQUES
// =============================================

Route::get('/resource-offers/{resourceOffer}', [ResourceOfferController::class, 'show'])
    ->where('resourceOffer', '[0-9]+');

Route::get('/portfolio/{slug}', [PortfolioController::class, 'show']);