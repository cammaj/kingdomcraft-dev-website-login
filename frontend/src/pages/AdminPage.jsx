import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
    Users, Settings, Newspaper, Power, Calendar, 
    Edit2, Trash2, Plus, Save, X, Loader2, Shield
} from 'lucide-react';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AdminPage = () => {
    const { t, language, fetchSettings } = useLanguage();
    const { user } = useAuth();
    
    const [activeTab, setActiveTab] = useState('settings');
    const [users, setUsers] = useState([]);
    const [news, setNews] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // Form states
    const [userForm, setUserForm] = useState({ email: '', password: '', username: '', role: 'user' });
    const [newsForm, setNewsForm] = useState({ title_pl: '', title_en: '', content_pl: '', content_en: '' });

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'news') fetchNews();
        if (activeTab === 'settings') fetchSiteSettings();
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users');
        }
    };

    const fetchNews = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/news`);
            setNews(response.data);
        } catch (err) {
            setError('Failed to fetch news');
        }
    };

    const fetchSiteSettings = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/settings`);
            setSettings(response.data);
        } catch (err) {
            setError('Failed to fetch settings');
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.put(`${API_URL}/api/admin/settings`, settings, { withCredentials: true });
            setSuccess('Settings saved!');
            fetchSettings();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save settings');
        }
        setLoading(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/admin/users`, userForm, { withCredentials: true });
            setShowUserModal(false);
            setUserForm({ email: '', password: '', username: '', role: 'user' });
            fetchUsers();
            setSuccess('User created!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create user');
        }
        setLoading(false);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;
        setLoading(true);
        setError('');
        try {
            await axios.put(`${API_URL}/api/admin/users/${editingUser.id}`, 
                { username: userForm.username, email: userForm.email, role: userForm.role },
                { withCredentials: true }
            );
            setEditingUser(null);
            setShowUserModal(false);
            setUserForm({ email: '', password: '', username: '', role: 'user' });
            fetchUsers();
            setSuccess('User updated!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update user');
        }
        setLoading(false);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`${API_URL}/api/admin/users/${userId}`, { withCredentials: true });
            fetchUsers();
            setSuccess('User deleted!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    const handleCreateNews = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/admin/news`, newsForm, { withCredentials: true });
            setShowNewsModal(false);
            setNewsForm({ title_pl: '', title_en: '', content_pl: '', content_en: '' });
            fetchNews();
            setSuccess('News created!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create news');
        }
        setLoading(false);
    };

    const handleDeleteNews = async (newsId) => {
        if (!window.confirm('Are you sure you want to delete this news?')) return;
        try {
            await axios.delete(`${API_URL}/api/admin/news/${newsId}`, { withCredentials: true });
            fetchNews();
            setSuccess('News deleted!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete news');
        }
    };

    const openEditUser = (user) => {
        setEditingUser(user);
        setUserForm({ email: user.email, password: '', username: user.username, role: user.role });
        setShowUserModal(true);
    };

    const tabs = [
        { id: 'settings', label: t('settings'), icon: Settings },
        { id: 'users', label: t('users'), icon: Users },
        { id: 'news', label: t('news_management'), icon: Newspaper },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="admin-page">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 min-h-screen pt-20 pb-12 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="font-display text-3xl sm:text-4xl font-bold flex items-center gap-3">
                            <Shield className="h-8 w-8 text-primary" />
                            <span className="text-gradient">{t('admin_panel')}</span>
                        </h1>
                    </motion.div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {tabs.map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? 'default' : 'outline'}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2"
                                data-testid={`tab-${tab.id}`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    {/* Settings Tab */}
                    {activeTab === 'settings' && settings && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card rounded-2xl p-6 sm:p-8"
                        >
                            <div className="space-y-6">
                                {/* Maintenance Mode Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-background/50">
                                    <div className="flex items-center gap-3">
                                        <Power className={`h-5 w-5 ${settings.maintenance_mode ? 'text-yellow-500' : 'text-green-500'}`} />
                                        <div>
                                            <p className="font-medium">{t('maintenance_mode')}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {settings.maintenance_mode ? t('maintenance_enabled') : t('maintenance_disabled')}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={settings.maintenance_mode}
                                        onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                                        data-testid="maintenance-toggle"
                                    />
                                </div>

                                {/* Countdown Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {t('countdown_date')}
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={settings.countdown_date?.slice(0, 16) || ''}
                                        onChange={(e) => setSettings({ ...settings, countdown_date: e.target.value + ':00' })}
                                        className="bg-background/50"
                                        data-testid="countdown-date-input"
                                    />
                                </div>

                                {/* Maintenance Text PL */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('maintenance_text')} (PL)</label>
                                    <Input
                                        value={settings.maintenance_text_pl || ''}
                                        onChange={(e) => setSettings({ ...settings, maintenance_text_pl: e.target.value })}
                                        className="bg-background/50"
                                        data-testid="maintenance-text-pl"
                                    />
                                </div>

                                {/* Maintenance Text EN */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('maintenance_text')} (EN)</label>
                                    <Input
                                        value={settings.maintenance_text_en || ''}
                                        onChange={(e) => setSettings({ ...settings, maintenance_text_en: e.target.value })}
                                        className="bg-background/50"
                                        data-testid="maintenance-text-en"
                                    />
                                </div>

                                {/* Maintenance Desc PL */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('maintenance_desc')} (PL)</label>
                                    <textarea
                                        value={settings.maintenance_description_pl || ''}
                                        onChange={(e) => setSettings({ ...settings, maintenance_description_pl: e.target.value })}
                                        className="w-full p-3 rounded-md bg-background/50 border border-input min-h-[100px] resize-none"
                                        data-testid="maintenance-desc-pl"
                                    />
                                </div>

                                {/* Maintenance Desc EN */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('maintenance_desc')} (EN)</label>
                                    <textarea
                                        value={settings.maintenance_description_en || ''}
                                        onChange={(e) => setSettings({ ...settings, maintenance_description_en: e.target.value })}
                                        className="w-full p-3 rounded-md bg-background/50 border border-input min-h-[100px] resize-none"
                                        data-testid="maintenance-desc-en"
                                    />
                                </div>

                                <Button 
                                    onClick={handleSaveSettings} 
                                    disabled={loading}
                                    className="w-full sm:w-auto"
                                    data-testid="save-settings-btn"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    {t('save')}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card rounded-2xl p-6 sm:p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-display text-xl font-bold">{t('users')}</h2>
                                <Button onClick={() => { setEditingUser(null); setUserForm({ email: '', password: '', username: '', role: 'user' }); setShowUserModal(true); }} data-testid="add-user-btn">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('add_user')}
                                </Button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('username')}</th>
                                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('email')}</th>
                                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('role')}</th>
                                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id} className="border-b border-border/50" data-testid={`user-row-${u.id}`}>
                                                <td className="p-3">{u.username}</td>
                                                <td className="p-3 text-muted-foreground">{u.email}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="ghost" onClick={() => openEditUser(u)} data-testid={`edit-user-${u.id}`}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        {u.id !== user?.id && (
                                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteUser(u.id)} data-testid={`delete-user-${u.id}`}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* News Tab */}
                    {activeTab === 'news' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card rounded-2xl p-6 sm:p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-display text-xl font-bold">{t('news_management')}</h2>
                                <Button onClick={() => setShowNewsModal(true)} data-testid="add-news-btn">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('add_news')}
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {news.map((item) => (
                                    <div key={item.id} className="p-4 rounded-xl bg-background/50 flex justify-between items-start" data-testid={`news-row-${item.id}`}>
                                        <div>
                                            <h3 className="font-medium">{language === 'pl' ? item.title_pl : item.title_en}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{language === 'pl' ? item.content_pl : item.content_en}</p>
                                            <p className="text-xs text-muted-foreground/60 mt-2">{item.author_name} • {new Date(item.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteNews(item.id)} data-testid={`delete-news-${item.id}`}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {news.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">{t('no_news')}</p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* User Modal */}
                    {showUserModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card rounded-2xl p-6 w-full max-w-md"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-display text-xl font-bold">{editingUser ? t('edit') : t('add_user')}</h3>
                                    <Button size="icon" variant="ghost" onClick={() => setShowUserModal(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                                    <Input
                                        placeholder={t('username')}
                                        value={userForm.username}
                                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                        required
                                        data-testid="user-form-username"
                                    />
                                    <Input
                                        type="email"
                                        placeholder={t('email')}
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        required
                                        data-testid="user-form-email"
                                    />
                                    {!editingUser && (
                                        <Input
                                            type="password"
                                            placeholder={t('password')}
                                            value={userForm.password}
                                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                            required
                                            data-testid="user-form-password"
                                        />
                                    )}
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input"
                                        data-testid="user-form-role"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <div className="flex gap-2 justify-end">
                                        <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>
                                            {t('cancel')}
                                        </Button>
                                        <Button type="submit" disabled={loading} data-testid="user-form-submit">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}

                    {/* News Modal */}
                    {showNewsModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-display text-xl font-bold">{t('add_news')}</h3>
                                    <Button size="icon" variant="ghost" onClick={() => setShowNewsModal(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <form onSubmit={handleCreateNews} className="space-y-4">
                                    <Input
                                        placeholder={`${t('title')} (PL)`}
                                        value={newsForm.title_pl}
                                        onChange={(e) => setNewsForm({ ...newsForm, title_pl: e.target.value })}
                                        required
                                        data-testid="news-form-title-pl"
                                    />
                                    <Input
                                        placeholder={`${t('title')} (EN)`}
                                        value={newsForm.title_en}
                                        onChange={(e) => setNewsForm({ ...newsForm, title_en: e.target.value })}
                                        required
                                        data-testid="news-form-title-en"
                                    />
                                    <textarea
                                        placeholder={`${t('content')} (PL)`}
                                        value={newsForm.content_pl}
                                        onChange={(e) => setNewsForm({ ...newsForm, content_pl: e.target.value })}
                                        className="w-full p-3 rounded-md bg-background border border-input min-h-[100px] resize-none"
                                        required
                                        data-testid="news-form-content-pl"
                                    />
                                    <textarea
                                        placeholder={`${t('content')} (EN)`}
                                        value={newsForm.content_en}
                                        onChange={(e) => setNewsForm({ ...newsForm, content_en: e.target.value })}
                                        className="w-full p-3 rounded-md bg-background border border-input min-h-[100px] resize-none"
                                        required
                                        data-testid="news-form-content-en"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button type="button" variant="outline" onClick={() => setShowNewsModal(false)}>
                                            {t('cancel')}
                                        </Button>
                                        <Button type="submit" disabled={loading} data-testid="news-form-submit">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
