import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import api from "./services/api";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import OAuthCallback from "./pages/auth/OAuthCallback";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/dashboard/AccountSettings";
import CompanyProfile from "./pages/CompanyProfile";
import Opportunities from "./pages/Opportunities";
import ResourceRequestDetail from "./pages/ResourceRequestDetail";
import BrowseResourceRequests from "./pages/BrowseResourceRequests";
import CreateResourceRequest from "./pages/CreateResourceRequest";
import Missions from "./pages/Missions";
import MissionDetail from "./pages/MissionDetail";
import JobOffers from "./pages/JobOffers";
import Messages from "./pages/Messages";
import AdminVerifications from "./pages/AdminVerifications";
import Explore from "./pages/Explore";
import ExploreDashboard from "./pages/ExploreDashboard";
import MyActivity from "./pages/MyActivity";
import TalentProfile from "./pages/TalentProfile";
import Help from './pages/Help';
import Guide from './pages/Guide';
import Cgu from './pages/Cgu';
import Confidentialite from './pages/Confidentialite';
import PublicPortfolio from "./pages/PublicPortfolio";
import ResourceOffers from "./pages/ResourceOffers";
import BrowseResourceOffers from "./pages/BrowseResourceOffers";
import ResourceOfferDetail from "./pages/ResourceOfferDetail";
import CreateProposal from "./pages/CreateProposal";
import Appearance from "./pages/Appearance";
import OfferApplications from "./pages/dashboard/OfferApplications";
import ApplicationDetail from "./pages/dashboard/ApplicationDetail";
import MyPublications from "./pages/MyPublications";
import Accueil from "./pages/Accueil";
import Actualite from "./pages/Actualite";
import JobOfferDetail from "./pages/JobOfferDetail";
import ActivityHistoryPage from "./pages/ActivityHistoryPage";
import Explorer from "./pages/Explorer";
import CreateCompanyPage from "./pages/CreateCompanyPage";

import ResourceOfferForm from "./pages/ResourceOfferForm";
import ResourceProposals from "./pages/ResourceProposals";
import ProposalRouter from "./pages/ProposalRouter";
import CompanyPublicProfile from "./pages/CompanyPublicProfile";
import InterviewRoom from "./pages/InterviewRoom";
import Collaborations from "./pages/Collaborations";
import TalentMarket from "./pages/TalentMarket";

/* ============================================================
    GUARDS & LOADING
============================================================ */

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8FA] px-4 text-[#102A43]" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <LoaderCircle size={20} className="animate-spin text-[#0F9691]" aria-hidden="true" />
        <span className="text-sm font-semibold">Chargement de votre espace…</span>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  return user ? children : <Navigate to="/login" />;
};

function RequireCompany({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;

  if (user?.role !== "company") {
    return <Navigate to="/my-activity" replace />;
  }
  return children;
}

/* ============================================================
    ✅ COMPANY GUARD — Redirection post-inscription
============================================================ */

function CompanyGuard({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [hasCompany, setHasCompany] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkCompany = async () => {
      if (user?.role !== "company") {
        if (isMounted) setChecking(false);
        return;
      }

      if (location.pathname === "/company" || location.pathname === "/company/create") {
        if (isMounted) setChecking(false);
        return;
      }

      try {
        await api.get("/companies/me");
        if (isMounted) setHasCompany(true);
      } catch (err) {
        if (err.response?.status === 404) {
          if (isMounted) setHasCompany(false);
        } else {
          if (isMounted) setHasCompany(true);
        }
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    if (!authLoading) {
      checkCompany();
    }

    return () => { isMounted = false; };
  }, [user, authLoading, location.pathname]);

  if (authLoading || checking) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "company" && hasCompany === false && location.pathname !== "/company") {
    return <Navigate to="/company" replace />;
  }

  return children;
}

function CandidatesRedirect() {
  const { id } = useParams();
  return <Navigate to={`/resource-requests/${id}`} replace />;
}

/* ============================================================
    APP
============================================================ */

function App() {
  return (
    <Router>
      <Routes>
        {/* ============ ROUTES PUBLIQUES ============ */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/email/verify" element={<VerifyEmail />} />
        <Route path="/entreprises/:id" element={<CompanyPublicProfile />} />

        <Route path="/auth/callback" element={<OAuthCallback />} />

        <Route path="/explore" element={<Explore />} />
        <Route path="/talents/:id" element={<TalentProfile />} />
        <Route path="/portfolio/:slug" element={<PublicPortfolio />} />

        <Route 
          path="/resource-offers/browse" 
          element={
            <ProtectedRoute>
              <TalentMarket />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/resource-offers/:id" element={<ResourceOfferDetail />} />

        <Route path="/browse-requests" element={<BrowseResourceRequests />} />

        {/* ============ ROUTES PROTÉGÉES ============ */}
        <Route path="/accueil" element={<ProtectedRoute><Accueil /></ProtectedRoute>} />
        <Route path="/actualite" element={<ProtectedRoute><Actualite /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/explore-dashboard" element={<ProtectedRoute><ExploreDashboard /></ProtectedRoute>} />
        <Route path="/my-activity" element={<ProtectedRoute><MyActivity /></ProtectedRoute>} />

        {/* ✅ ROUTE MODIFIÉE : Plus de ProtectedRoute pour permettre l'accès via le lien de l'email */}
        <Route path="/interview/:roomId" element={<InterviewRoom />} />

        <Route path="/collaborations" element={<ProtectedRoute><Collaborations /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/view" element={<Navigate to="/profile" replace />} />
        <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

        <Route 
          path="/company" 
          element={
            <ProtectedRoute>
              <CompanyGuard>
                <CompanyProfile />
              </CompanyGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/company/create" 
          element={
            <ProtectedRoute>
              <CompanyGuard>
                <CreateCompanyPage />
              </CompanyGuard>
            </ProtectedRoute>
          } 
        />

        <Route path="/opportunites" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
        <Route path="/opportunites/:id" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />

        <Route path="/my-publications" element={<ProtectedRoute><MyPublications /></ProtectedRoute>} />
        <Route path="/explorer" element={<ProtectedRoute><Explorer /></ProtectedRoute>} />

        <Route path="/my-offers" element={<Navigate to="/my-publications" replace />} />

        <Route
          path="/resource-requests/new"
          element={
            <ProtectedRoute>
              <CreateResourceRequest />
            </ProtectedRoute>
          }
        />

        <Route path="/resource-requests/:id/candidates" element={<CandidatesRedirect />} />

        <Route
          path="/resource-requests/:id"
          element={
            <ProtectedRoute>
              <ResourceRequestDetail />
            </ProtectedRoute>
          }
        />

        <Route path="/resource-requests" element={<Navigate to="/my-publications" replace />} />

        <Route
          path="/proposals/new"
          element={
            <ProtectedRoute>
              <RequireCompany>
                <CreateProposal />
              </RequireCompany>
            </ProtectedRoute>
          }
        />

        <Route path="/proposals/:id" element={<ProtectedRoute><ProposalRouter /></ProtectedRoute>} />

        <Route path="/job-offers/:id/applications" element={<ProtectedRoute><OfferApplications /></ProtectedRoute>} />
        <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />

        <Route path="/missions/:id" element={<ProtectedRoute><MissionDetail /></ProtectedRoute>} />

        <Route path="/job-offers" element={<ProtectedRoute><JobOffers /></ProtectedRoute>} />
        <Route path="/job-offers/:id" element={<ProtectedRoute><JobOfferDetail /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

        <Route path="/admin/verifications" element={<ProtectedRoute><AdminVerifications /></ProtectedRoute>} />

        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
        <Route path="/cgu" element={<ProtectedRoute><Cgu /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><ActivityHistoryPage /></ProtectedRoute>} />
        <Route path="/confidentialite" element={<ProtectedRoute><Confidentialite /></ProtectedRoute>} />

        <Route path="/resource-offers" element={<ProtectedRoute><ResourceOffers /></ProtectedRoute>} />
        <Route path="/resource-offers/new" element={<ProtectedRoute><ResourceOfferForm /></ProtectedRoute>} />
        <Route path="/resource-offers/:id/edit" element={<ProtectedRoute><ResourceOfferForm /></ProtectedRoute>} />

        <Route path="/resource-proposals" element={<Navigate to="/collaborations?tab=received" replace />} />
        <Route path="/missions" element={<Navigate to="/collaborations?tab=missions" replace />} />

        <Route path="/appearance" element={<Appearance />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;