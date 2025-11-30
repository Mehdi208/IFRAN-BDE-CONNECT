
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Public Pages
import Home from './pages/Home';
import CalendarPage from './pages/Calendar';
import Clubs from './pages/Clubs';
import Tutoring from './pages/Tutoring';
import Team from './pages/Team';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContributions from './pages/admin/AdminContributions';
import AdminClubs from './pages/admin/AdminClubs';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminEvents from './pages/admin/AdminEvents';
import AdminMembers from './pages/admin/AdminMembers';
import AdminCinema from './pages/admin/AdminCinema';

// Composant utilitaire pour remonter en haut de page à chaque changement de route
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <HashRouter>
      <ScrollToTop /> {/* Ce composant écoute les changements de page */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/tutoring" element={<Tutoring />} />
        <Route path="/team" element={<Team />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/contributions" element={<ProtectedRoute><AdminContributions /></ProtectedRoute>} />
        <Route path="/admin/clubs" element={<ProtectedRoute><AdminClubs /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute><AdminDocuments /></ProtectedRoute>} />
        <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
        <Route path="/admin/members" element={<ProtectedRoute><AdminMembers /></ProtectedRoute>} />
        <Route path="/admin/cinema" element={<ProtectedRoute><AdminCinema /></ProtectedRoute>} />
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
