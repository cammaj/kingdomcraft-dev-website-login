import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Users, ArrowLeft, Edit2, Trash2, Plus, X, Loader2, Search, Shield, User
} from 'lucide-react';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const UsersManagerPage = () => {
    const { t, language } = useLanguage();
    const { user: currentUser } = useAuth();
    
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({ email: '', password: '', username: '', role: 'user' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = users.filter(u => 
                u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (err) {
            setError('Nie udało się pobrać użytkowników');
        }
        setLoading(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/admin/users`, userForm, { withCredentials: true });
            setShowUserModal(false);
            setUserForm({ email: '', password: '', username: '', role: 'user' });
            fetchUsers();
            setSuccess('Użytkownik utworzony!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Błąd podczas tworzenia użytkownika');
        }
        setSaving(false);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;
        setSaving(true);
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
            setSuccess('Użytkownik zaktualizowany!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Błąd podczas aktualizacji');
        }
        setSaving(false);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
        try {
            await axios.delete(`${API_URL}/api/admin/users/${userId}`, { withCredentials: true });
            fetchUsers();
            setSuccess('Użytkownik usunięty!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Nie można usunąć użytkownika');
        }
    };

    const openEditUser = (user) => {
        setEditingUser(user);
        setUserForm({ email: user.email, password: '', username: user.username, role: user.role });
        setShowUserModal(true);
    };

    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="users-manager">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 pt-20 pb-12 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Back Link */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6"
                    >
                        <Link
                            to="/admin"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Wróć do panelu
                        </Link>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
                    >
                        <div>
                            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                                <Users className="h-8 w-8 text-primary" />
                                <span className="text-gradient">Zarządzanie użytkownikami</span>
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {users.length} użytkowników ({adminCount} adminów, {userCount} zwykłych)
                            </p>
                        </div>
                        <Button
                            onClick={() => { 
                                setEditingUser(null); 
                                setUserForm({ email: '', password: '', username: '', role: 'user' }); 
                                setShowUserModal(true); 
                            }}
                            className="bg-primary hover:bg-primary/90"
                            data-testid="add-user-btn"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Dodaj użytkownika
                        </Button>
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

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                    >
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Szukaj użytkownika..."
                                className="pl-10 bg-background/50"
                            />
                        </div>
                    </motion.div>

                    {/* Users List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card rounded-xl overflow-hidden"
                    >
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Użytkownik</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rola</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data rejestracji</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className="border-t border-border/50 hover:bg-muted/10 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                                            {u.profile_picture ? (
                                                                <img 
                                                                    src={u.profile_picture.startsWith('http') ? u.profile_picture : `${API_URL}${u.profile_picture}`} 
                                                                    alt="" 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-medium">{u.username?.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <span className="font-medium">{u.username}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-muted-foreground">{u.email}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        u.role === 'admin' 
                                                            ? 'bg-primary/20 text-primary' 
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {u.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-muted-foreground text-sm">
                                                    {new Date(u.created_at).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            onClick={() => openEditUser(u)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        {u.id !== currentUser?.id && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className="text-destructive hover:text-destructive" 
                                                                onClick={() => handleDeleteUser(u.id)}
                                                            >
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
                        )}
                    </motion.div>
                </div>

                {/* User Modal */}
                {showUserModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-display text-xl font-bold">
                                    {editingUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
                                </h3>
                                <Button size="icon" variant="ghost" onClick={() => setShowUserModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Nazwa użytkownika</label>
                                    <Input
                                        value={userForm.username}
                                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                {!editingUser && (
                                    <div>
                                        <label className="text-sm font-medium">Hasło</label>
                                        <Input
                                            type="password"
                                            value={userForm.password}
                                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium">Rola</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                        className="w-full mt-1 p-2 rounded-md bg-background border border-input"
                                    >
                                        <option value="user">Użytkownik</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>
                                        Anuluj
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zapisz'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};
