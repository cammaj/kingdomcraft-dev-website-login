import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Loader2, Save } from 'lucide-react';
import axios from 'axios';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ProfilePage = () => {
    const { t } = useLanguage();
    const { user, updateUser } = useAuth();
    
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await axios.put(`${API_URL}/api/users/me`, 
                { username, email },
                { withCredentials: true }
            );
            updateUser(response.data);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        }
        setLoading(false);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/api/users/me/avatar`,
                formData,
                { 
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            updateUser({ profile_picture: response.data.profile_picture });
            setSuccess('Avatar updated!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to upload avatar');
        }
        setAvatarLoading(false);
    };

    const getAvatarUrl = () => {
        if (!user?.profile_picture) return null;
        if (user.profile_picture.startsWith('http')) return user.profile_picture;
        return `${API_URL}${user.profile_picture}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="profile-page">
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
                            <span className="text-gradient">{t('my_profile')}</span>
                        </h1>

                        {/* Avatar */}
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                <div 
                                    className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center overflow-hidden"
                                    data-testid="profile-avatar"
                                >
                                    {user?.profile_picture ? (
                                        <img 
                                            src={getAvatarUrl()} 
                                            alt="Avatar" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-12 w-12 text-primary" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={avatarLoading}
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                                    data-testid="change-avatar-btn"
                                >
                                    {avatarLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                                    ) : (
                                        <Camera className="h-4 w-4 text-primary-foreground" />
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                    {error}
                                </div>
                            )}
                            
                            {success && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('username')}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10 bg-background/50"
                                        required
                                        data-testid="profile-username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-background/50"
                                        required
                                        data-testid="profile-email"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <span>{t('role')}: <span className="text-primary font-medium">{user?.role}</span></span>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={loading}
                                data-testid="save-profile-btn"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {t('save')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
