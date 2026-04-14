import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext();

// Helper to format API errors
const formatApiError = (detail) => {
    if (detail == null) return "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // null = checking, false = not authenticated, object = authenticated
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        // CRITICAL: If returning from OAuth callback, skip the /me check
        if (window.location.hash?.includes('session_id=')) {
            setLoading(false);
            return;
        }
        
        try {
            const response = await axios.get(`${API_URL}/api/auth/me`, {
                withCredentials: true
            });
            setUser(response.data);
        } catch (error) {
            setUser(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, 
                { email, password },
                { withCredentials: true }
            );
            setUser(response.data);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: formatApiError(error.response?.data?.detail) || error.message 
            };
        }
    };

    const register = async (email, password, username) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`,
                { email, password, username },
                { withCredentials: true }
            );
            setUser(response.data);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: formatApiError(error.response?.data?.detail) || error.message 
            };
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(false);
    };

    const loginWithGoogle = () => {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + '/auth/callback';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    const processGoogleSession = async (sessionId) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/google/session`,
                { session_id: sessionId },
                { withCredentials: true }
            );
            setUser(response.data);
            return { success: true, user: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: formatApiError(error.response?.data?.detail) || error.message 
            };
        }
    };

    const updateUser = (newData) => {
        setUser(prev => prev ? { ...prev, ...newData } : prev);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            loginWithGoogle,
            processGoogleSession,
            updateUser,
            checkAuth,
            isAuthenticated: !!user && user !== false,
            isAdmin: user?.role === 'admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
