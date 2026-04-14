import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Users, Settings, Power, Shield, FileText, BarChart3,
    TrendingUp, Eye, Clock, UserPlus, Loader2
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar
} from 'recharts';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subValue, color = "primary", trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-5"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className="text-3xl font-display font-bold">{value}</p>
                {subValue && (
                    <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
                )}
            </div>
            <div className={`p-3 rounded-xl bg-${color}/10`}>
                <Icon className={`h-6 w-6 text-${color}`} />
            </div>
        </div>
        {trend && (
            <div className="flex items-center gap-1 mt-3 text-sm text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span>{trend}</span>
            </div>
        )}
    </motion.div>
);

// Quick Action Card
const QuickActionCard = ({ icon: Icon, title, description, onClick, color = "primary" }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-card rounded-xl p-5 text-left w-full hover:border-primary/50 transition-colors"
    >
        <div className={`inline-flex p-3 rounded-xl bg-${color}/10 mb-3`}>
            <Icon className={`h-5 w-5 text-${color}`} />
        </div>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
    </motion.button>
);

export const AdminPage = () => {
    const { t, language, fetchSettings, siteSettings } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    useEffect(() => {
        fetchAnalytics();
        if (siteSettings) {
            setMaintenanceMode(siteSettings.maintenance_mode);
        }
    }, [siteSettings]);

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/analytics/summary`, { 
                withCredentials: true 
            });
            setAnalytics(response.data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        }
        setLoading(false);
    };

    const toggleMaintenanceMode = async () => {
        setSaving(true);
        try {
            await axios.put(`${API_URL}/api/admin/settings`, 
                { maintenance_mode: !maintenanceMode },
                { withCredentials: true }
            );
            setMaintenanceMode(!maintenanceMode);
            fetchSettings();
        } catch (err) {
            console.error('Failed to update settings:', err);
        }
        setSaving(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { 
            day: 'numeric', 
            month: 'short' 
        });
    };

    const chartData = analytics?.chart_data?.map(d => ({
        ...d,
        name: formatDate(d.date)
    })) || [];

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="admin-page">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 min-h-screen pt-20 pb-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
                    >
                        <div>
                            <h1 className="font-display text-3xl sm:text-4xl font-bold flex items-center gap-3">
                                <Shield className="h-8 w-8 text-primary" />
                                <span className="text-gradient">Panel Administracyjny</span>
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Witaj, {user?.username}! Zarządzaj swoją stroną.
                            </p>
                        </div>

                        {/* Maintenance Toggle */}
                        <div className="flex items-center gap-4 glass-card rounded-xl px-5 py-3">
                            <div className="flex items-center gap-2">
                                <Power className={`h-5 w-5 ${maintenanceMode ? 'text-yellow-500' : 'text-green-500'}`} />
                                <span className="font-medium">
                                    {maintenanceMode ? 'Tryb konserwacji' : 'Serwer aktywny'}
                                </span>
                            </div>
                            <Switch
                                checked={maintenanceMode}
                                onCheckedChange={toggleMaintenanceMode}
                                disabled={saving}
                                data-testid="maintenance-toggle"
                            />
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <StatCard
                                    icon={Users}
                                    label="Użytkownicy"
                                    value={analytics?.total_users || 0}
                                    subValue={`${analytics?.admin_users || 0} adminów`}
                                    color="primary"
                                />
                                <StatCard
                                    icon={FileText}
                                    label="Strony"
                                    value={analytics?.total_pages || 0}
                                    subValue={`${analytics?.custom_pages || 0} własnych`}
                                    color="primary"
                                />
                                <StatCard
                                    icon={Eye}
                                    label="Odsłony (7 dni)"
                                    value={analytics?.views_this_week || 0}
                                    color="primary"
                                />
                                <StatCard
                                    icon={BarChart3}
                                    label="Status"
                                    value={maintenanceMode ? 'Maintenance' : 'Online'}
                                    subValue={maintenanceMode ? 'Tylko admini' : 'Publiczny'}
                                    color={maintenanceMode ? 'yellow-500' : 'green-500'}
                                />
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {/* Views Chart */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="lg:col-span-2 glass-card rounded-xl p-6"
                                >
                                    <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Odsłony strony (ostatnie 7 dni)
                                    </h3>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#D946EF" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#D946EF" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="rgba(255,255,255,0.5)"
                                                    fontSize={12}
                                                />
                                                <YAxis 
                                                    stroke="rgba(255,255,255,0.5)"
                                                    fontSize={12}
                                                />
                                                <Tooltip 
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                                        border: '1px solid rgba(217,70,239,0.3)',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="views" 
                                                    stroke="#D946EF" 
                                                    fillOpacity={1} 
                                                    fill="url(#colorViews)" 
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* Top Pages */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="glass-card rounded-xl p-6"
                                >
                                    <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Popularne strony
                                    </h3>
                                    <div className="space-y-3">
                                        {analytics?.top_pages?.length > 0 ? (
                                            analytics.top_pages.map((page, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                                                    <span className="text-sm truncate flex-1">{page.path}</span>
                                                    <span className="text-sm font-medium text-primary ml-2">
                                                        {page.total_views}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Brak danych
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Quick Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mb-8"
                            >
                                <h3 className="font-display font-bold mb-4">Szybkie akcje</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <QuickActionCard
                                        icon={FileText}
                                        title="Zarządzaj stronami"
                                        description="Twórz i edytuj strony"
                                        onClick={() => navigate('/admin/pages')}
                                    />
                                    <QuickActionCard
                                        icon={Users}
                                        title="Użytkownicy"
                                        description="Zarządzaj kontami"
                                        onClick={() => navigate('/admin/users')}
                                    />
                                    <QuickActionCard
                                        icon={Settings}
                                        title="Ustawienia SEO"
                                        description="Optymalizacja wyszukiwarek"
                                        onClick={() => navigate('/admin/seo')}
                                    />
                                    <QuickActionCard
                                        icon={Eye}
                                        title="Podgląd strony"
                                        description="Zobacz stronę publiczną"
                                        onClick={() => window.open('/', '_blank')}
                                    />
                                </div>
                            </motion.div>

                            {/* Recent Users */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="glass-card rounded-xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display font-bold flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-primary" />
                                        Ostatnio zarejestrowani
                                    </h3>
                                    <Link to="/admin/users" className="text-sm text-primary hover:underline">
                                        Zobacz wszystkich
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Użytkownik</th>
                                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rola</th>
                                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics?.recent_users?.map((u) => (
                                                <tr key={u.id} className="border-b border-border/50">
                                                    <td className="p-3 flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                            {u.profile_picture ? (
                                                                <img src={u.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-medium">{u.username?.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <span className="font-medium">{u.username}</span>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{u.email}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground text-sm">
                                                        {new Date(u.created_at).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};
