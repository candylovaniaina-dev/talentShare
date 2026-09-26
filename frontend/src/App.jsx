import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Universities from "./pages/Universities";
import UniversityDetail from "./pages/UniversityDetail";
import CreateUniversity from "./pages/CreateUniversity";
import EditUniversity from "./pages/EditUniversity";
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
import ResourceRequests from "./pages/ResourceRequests";
import ResourceRequestDetail from "./pages/ResourceRequestDetail";
import ResourceRequestCandidates from "./pages/ResourceRequestCandidates";
import BrowseResourceRequests from "./pages/BrowseResourceRequests";
import Missions from "./pages/Missions";
import MissionDetail from "./pages/MissionDetail";
import JobOffers from "./pages/JobOffers";
import Messages from "./pages/Messages";
import AdminVerifications from "./pages/AdminVerifications";
import Explore from "./pages/Explore";
import TalentProfile from "./pages/TalentProfile";
import CreateResourceRequest from "./pages/CreateResourceRequest";
import Help from './pages/Help';
import Guide from './pages/Guide';
import Cgu from './pages/Cgu';
import Confidentialite from './pages/Confidentialite';
import PublicPortfolio from "./pages/PublicPortfolio";
import ResourceOffers from "./pages/ResourceOffers";
import CreateResourceOffer from "./pages/CreateResourceOffer";
import BrowseResourceOffers from "./pages/BrowseResourceOffers";
import ResourceOfferDetail from "./pages/ResourceOfferDetail";
import Proposals from "./pages/Proposals";
import CreateProposal from "./pages/CreateProposal";
import ProposalDetail from "./pages/ProposalDetail";
import Appearance from "./pages/Appearance";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ============ ROUTES PUBLIQUES ============ */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/universities" element={<Universities />} />
          <Route path="/universities/new" element={<CreateUniversity />} />
          <Route path="/universities/:id/edit" element={<EditUniversity />} />
          <Route path="/universities/:id" element={<UniversityDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email/verify" element={<VerifyEmail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/talents/:id" element={<TalentProfile />} />
          <Route path="/portfolio/:slug" element={<PublicPortfolio />} />

          {/* RESOURCE OFFERS (publics) — /browse AVANT /:id */}
          <Route path="/resource-offers/browse" element={<BrowseResourceOffers />} />
          <Route path="/resource-offers/:id" element={<ResourceOfferDetail />} />

          {/* Browse public des demandes de ressources */}
          <Route path="/browse-requests" element={<BrowseResourceRequests />} />

          {/* ============ ROUTES PROTÉGÉES ============ */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Profil */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/view" element={<Navigate to="/profile" replace />} />
          <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

          {/* Entreprise */}
          <Route path="/company" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />

          {/* Opportunités */}
          <Route path="/opportunites" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />

          {/* =============================================
              ✅ P0-9 : RESOURCE REQUESTS
              ============================================= */}
          <Route path="/resource-requests" element={<ProtectedRoute><ResourceRequests /></ProtectedRoute>} />
          <Route path="/resource-requests/new" element={<ProtectedRoute><CreateResourceRequest /></ProtectedRoute>} />
          <Route path="/resource-requests/:id/candidates" element={<ProtectedRoute><ResourceRequestCandidates /></ProtectedRoute>} />
          <Route path="/resource-requests/:id/edit" element={<ProtectedRoute><CreateResourceRequest /></ProtectedRoute>} />
          <Route path="/resource-requests/:id" element={<ProtectedRoute><ResourceRequestDetail /></ProtectedRoute>} />

          {/* =============================================
              ✅ P0-11 : PROPOSITIONS
              ⚠️ ORDRE CRITIQUE : /new AVANT /:id
              ============================================= */}
          <Route path="/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
          <Route path="/proposals/new" element={<ProtectedRoute><CreateProposal /></ProtectedRoute>} />
          <Route path="/proposals/:id" element={<ProtectedRoute><ProposalDetail /></ProtectedRoute>} />

          {/* Missions */}
          <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
          <Route path="/missions/:id" element={<ProtectedRoute><MissionDetail /></ProtectedRoute>} />

          {/* Job Offers / Messages */}
          <Route path="/job-offers" element={<ProtectedRoute><JobOffers /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/verifications" element={<ProtectedRoute><AdminVerifications /></ProtectedRoute>} />

          {/* Pages statiques */}
          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
          <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
          <Route path="/cgu" element={<ProtectedRoute><Cgu /></ProtectedRoute>} />
          <Route path="/confidentialite" element={<ProtectedRoute><Confidentialite /></ProtectedRoute>} />

          {/* === RESOURCE OFFERS (protégés) === */}
          <Route path="/resource-offers" element={<ProtectedRoute><ResourceOffers /></ProtectedRoute>} />
          <Route path="/resource-offers/new" element={<ProtectedRoute><CreateResourceOffer /></ProtectedRoute>} />
          <Route path="/resource-offers/:id/edit" element={<ProtectedRoute><CreateResourceOffer /></ProtectedRoute>} />
       <Route path="/appearance" element={<Appearance />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;