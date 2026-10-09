import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/dashboard/AccountSettings";
import CompanyProfile from "./pages/CompanyProfile";
import Opportunities from "./pages/Opportunities";
import ResourceRequestDetail from "./pages/ResourceRequestDetail";
import BrowseResourceRequests from "./pages/BrowseResourceRequests";
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
import ProposalDetail from "./pages/ProposalDetail";
import Appearance from "./pages/Appearance";
import OfferApplications from "./pages/dashboard/OfferApplications";
import ApplicationDetail from "./pages/dashboard/ApplicationDetail";

import MyPublications from "./pages/MyPublications";

import Accueil from "./pages/Accueil";
import Actualite from "./pages/Actualite";

/* ============================================================
   GUARDS
============================================================ */

// ✅ Auth : utilisateur connecté requis
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

// ✅ Rôle entreprise requis (pour proposer un salarié)
function RequireCompany({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  if (user?.role !== "company") {
    return <Navigate to="/my-activity" replace />;
  }
  return children;
}

// ✅ Redirection dynamique des candidats
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
        <Route path="/explore" element={<Explore />} />
        <Route path="/talents/:id" element={<TalentProfile />} />
        <Route path="/portfolio/:slug" element={<PublicPortfolio />} />

        <Route path="/resource-offers/browse" element={<BrowseResourceOffers />} />
        <Route path="/resource-offers/:id" element={<ResourceOfferDetail />} />

        <Route path="/browse-requests" element={<BrowseResourceRequests />} />

        {/* ============ ROUTES PROTÉGÉES ============ */}
        <Route path="/accueil" element={<ProtectedRoute><Accueil /></ProtectedRoute>} />
        <Route path="/actualite" element={<ProtectedRoute><Actualite /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/explore-dashboard" element={<ProtectedRoute><ExploreDashboard /></ProtectedRoute>} />
        <Route path="/my-activity" element={<ProtectedRoute><MyActivity /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/view" element={<Navigate to="/profile" replace />} />
        <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

        <Route path="/company" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />

        {/* Opportunités */}
        <Route path="/opportunites" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
        <Route path="/opportunites/:id" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />

        {/* Page unifiée */}
        <Route path="/my-publications" element={<ProtectedRoute><MyPublications /></ProtectedRoute>} />

        {/* Redirections anciens liens */}
        <Route path="/my-offers" element={<Navigate to="/my-publications" replace />} />

        {/* ============================================================
            RESOURCE REQUESTS
            ⚠️ ORDRE CRITIQUE : /new AVANT /:id
        ============================================================ */}

      

        {/* Redirection candidats */}
        <Route path="/resource-requests/:id/candidates" element={<CandidatesRedirect />} />

        {/* Détail */}
        <Route
          path="/resource-requests/:id"
          element={
            <ProtectedRoute>
              <ResourceRequestDetail />
            </ProtectedRoute>
          }
        />

        {/* ⚠️ Redirection racine en DERNIER */}
        <Route path="/resource-requests" element={<Navigate to="/my-publications" replace />} />

        {/* ============================================================
            PROPOSITIONS — CRÉATION réservée aux entreprises
        ============================================================ */}
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
        <Route path="/proposals/:id" element={<ProtectedRoute><ProposalDetail /></ProtectedRoute>} />

        <Route path="/job-offers/:id/applications" element={<ProtectedRoute><OfferApplications /></ProtectedRoute>} />
        <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />

        <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
        <Route path="/missions/:id" element={<ProtectedRoute><MissionDetail /></ProtectedRoute>} />

        <Route path="/job-offers" element={<ProtectedRoute><JobOffers /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

        <Route path="/admin/verifications" element={<ProtectedRoute><AdminVerifications /></ProtectedRoute>} />

        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
        <Route path="/cgu" element={<ProtectedRoute><Cgu /></ProtectedRoute>} />
        <Route path="/confidentialite" element={<ProtectedRoute><Confidentialite /></ProtectedRoute>} />

        <Route path="/resource-offers" element={<ProtectedRoute><ResourceOffers /></ProtectedRoute>} />

        <Route path="/appearance" element={<Appearance />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;