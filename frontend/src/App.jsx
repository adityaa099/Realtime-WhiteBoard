import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import OAuthCallback from './pages/OAuthCallback';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    // If auth check is done and we have no token, instantly kick them to login
    // This runs on mount AND when restored from Chrome's back-forward cache
    if (!loading) {
      if (!localStorage.getItem('token')) {
        window.location.replace('/login');
      }
    }
  }, [loading]);

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  // Double-check: no token or no user = redirect immediately 
  if (!user || !localStorage.getItem('token')) {
    window.location.replace('/login');
    return null;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  const token = localStorage.getItem('token');
  if (user && token) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/room/:roomId" element={
        <ProtectedRoute>
          <Room />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
