import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MaintenancePage } from "./pages/MaintenancePage";
import { HomePage } from "./pages/HomePage";
import { RulesPage } from "./pages/RulesPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { AuthCallback } from "./components/AuthCallback";
import { Loader2 } from "lucide-react";

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || user === false) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Main content router with maintenance mode check
const MainRouter = () => {
    const { siteSettings } = useLanguage();
    const { isAdmin, loading } = useAuth();
    const location = useLocation();

    // Check for OAuth callback
    if (location.hash?.includes('session_id=') || location.pathname === '/auth/callback') {
        return <AuthCallback />;
    }

    // Show loading while checking auth and settings
    if (loading || siteSettings === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Maintenance mode - only admins can access full site
    const isMaintenanceMode = siteSettings?.maintenance_mode;

    return (
        <Routes>
            {/* Public routes always accessible */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Conditional routes based on maintenance mode */}
            {isMaintenanceMode && !isAdmin ? (
                // Maintenance mode for non-admins
                <Route path="*" element={<MaintenancePage />} />
            ) : (
                // Normal mode or admin access
                <>
                    <Route path="/" element={<HomePage />} />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </>
            )}
        </Routes>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <LanguageProvider>
                    <BrowserRouter>
                        <MainRouter />
                    </BrowserRouter>
                </LanguageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
