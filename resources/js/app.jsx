import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Documents from './pages/Documents';

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Public Route wrapper (redirects to documents if already logged in)
function PublicRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/documents" replace />;
    }

    return children;
}

// Placeholder for pages not yet created
function ComingSoon({ title }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                <p className="text-zinc-400">Coming soon...</p>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <DocumentProvider>
                <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        }
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/documents"
                        element={
                            <ProtectedRoute>
                                <Documents />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/documents/:id"
                        element={
                            <ProtectedRoute>
                                <ComingSoon title="Editor" />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/documents" replace />} />
                    <Route path="*" element={<Navigate to="/documents" replace />} />
                </Routes>
                </BrowserRouter>
            </DocumentProvider>
        </AuthProvider>
    );
}

const container = document.getElementById('app');

if (container) {
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}

