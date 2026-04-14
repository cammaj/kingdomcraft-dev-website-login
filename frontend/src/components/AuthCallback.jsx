import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { processGoogleSession } = useAuth();
    const hasProcessed = useRef(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const processSession = async () => {
            const hash = location.hash;
            const sessionIdMatch = hash.match(/session_id=([^&]+)/);
            
            if (!sessionIdMatch) {
                setError('No session ID found');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            const sessionId = sessionIdMatch[1];
            const result = await processGoogleSession(sessionId);
            
            if (result.success) {
                navigate('/', { replace: true });
            } else {
                setError(result.error);
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        processSession();
    }, [location, navigate, processGoogleSession]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                {error ? (
                    <div className="text-destructive">{error}</div>
                ) : (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Logging you in...</p>
                    </>
                )}
            </div>
        </div>
    );
};
