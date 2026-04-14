import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export const LoginPage = () => {
    const { t } = useLanguage();
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="login-page">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-card rounded-2xl p-8 glow-primary">
                        <h1 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8">
                            <span className="text-gradient">{t('login')}</span>
                        </h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder={t('email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-background/50"
                                        required
                                        data-testid="login-email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder={t('password')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-background/50"
                                        required
                                        data-testid="login-password"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={loading}
                                data-testid="login-submit"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    t('login')
                                )}
                            </Button>
                        </form>

                        <div className="my-6 flex items-center gap-4">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-sm text-muted-foreground">lub</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={loginWithGoogle}
                            data-testid="google-login"
                        >
                            <FaGoogle className="h-5 w-5 mr-2" />
                            {t('login_with_google')}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground mt-6">
                            {t('no_account')}{' '}
                            <Link to="/register" className="text-primary hover:underline" data-testid="register-link">
                                {t('register')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
