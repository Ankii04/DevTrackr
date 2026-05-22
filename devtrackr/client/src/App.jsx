import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import RepoDetail from './pages/RepoDetail';
import Contributors from './pages/Contributors';
import SprintAnalysis from './pages/SprintAnalysis';
import AIInsights from './pages/AIInsights';
import Settings from './pages/Settings';

// Protected Route boundary validator
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <DashboardProvider>
          <Routes>
            {/* Public Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/repositories"
              element={
                <ProtectedRoute>
                  <Repositories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/repo/:id"
              element={
                <ProtectedRoute>
                  <RepoDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributors"
              element={
                <ProtectedRoute>
                  <Contributors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sprint"
              element={
                <ProtectedRoute>
                  <SprintAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <AIInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* General redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </DashboardProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
