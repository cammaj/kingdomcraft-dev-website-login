import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Edit2, Trash2, Eye, FileText, Home, Wrench, 
    ArrowLeft, Loader2, GripVertical, Globe
} from 'lucide-react';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const PagesManagerPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPageSlug, setNewPageSlug] = useState('');
    const [newPageTitle, setNewPageTitle] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/pages`, { withCredentials: true });
            setPages(response.data);
        } catch (err) {
            setError('Nie udało się załadować stron');
        }
        setLoading(false);
    };

    const createPage = async () => {
        if (!newPageSlug || !newPageTitle) return;
        
        setCreating(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/api/admin/pages`, {
                slug: newPageSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                is_special: false,
                languages: {
                    pl: {
                        title: newPageTitle,
                        blocks: []
                    }
                }
            }, { withCredentials: true });
            
            setPages([...pages, response.data]);
            setShowCreateModal(false);
            setNewPageSlug('');
            setNewPageTitle('');
            setSuccess('Strona utworzona!');
            setTimeout(() => setSuccess(''), 3000);
            
            // Navigate to editor
            navigate(`/admin/pages/${response.data.id}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Błąd podczas tworzenia strony');
        }
        setCreating(false);
    };

    const deletePage = async (pageId) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę stronę?')) return;
        
        try {
            await axios.delete(`${API_URL}/api/admin/pages/${pageId}`, { withCredentials: true });
            setPages(pages.filter(p => p.id !== pageId));
            setSuccess('Strona usunięta!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Nie można usunąć strony');
        }
    };

    const toggleMenuVisibility = async (page) => {
        try {
            await axios.put(`${API_URL}/api/admin/pages/${page.id}`, {
                show_in_menu: !page.show_in_menu
            }, { withCredentials: true });
            
            setPages(pages.map(p => 
                p.id === page.id ? { ...p, show_in_menu: !p.show_in_menu } : p
            ));
        } catch (err) {
            setError('Błąd podczas aktualizacji');
        }
    };

    const specialPages = pages.filter(p => p.is_special);
    const regularPages = pages.filter(p => !p.is_special);

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="pages-manager">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 pt-20 pb-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
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
                        className="flex items-center justify-between mb-8"
                    >
                        <h1 className="font-display text-3xl font-bold">
                            <span className="text-gradient">Zarządzanie stronami</span>
                        </h1>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary hover:bg-primary/90"
                            data-testid="create-page-btn"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nowa strona
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

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Special Pages */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mb-8"
                            >
                                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                                    <Wrench className="h-5 w-5 text-primary" />
                                    Strony specjalne
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {specialPages.map(page => (
                                        <div
                                            key={page.id}
                                            className="glass-card rounded-xl p-5 flex items-center justify-between"
                                            data-testid={`special-page-${page.slug}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {page.slug === 'maintenance' ? (
                                                    <Wrench className="h-8 w-8 text-yellow-500" />
                                                ) : (
                                                    <Home className="h-8 w-8 text-green-500" />
                                                )}
                                                <div>
                                                    <h3 className="font-medium">
                                                        {page.slug === 'maintenance' ? 'Strona Maintenance' : 'Strona Główna'}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {Object.keys(page.languages || {}).map(l => l.toUpperCase()).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/admin/pages/${page.id}`)}
                                                data-testid={`edit-${page.slug}`}
                                            >
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Edytuj
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Regular Pages */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Podstrony
                                </h2>
                                
                                {regularPages.length === 0 ? (
                                    <div className="glass-card rounded-xl p-8 text-center">
                                        <p className="text-muted-foreground">
                                            Brak podstron. Kliknij "Nowa strona" aby utworzyć pierwszą.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {regularPages.map(page => (
                                            <div
                                                key={page.id}
                                                className="glass-card rounded-xl p-4 flex items-center justify-between"
                                                data-testid={`page-${page.id}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab" />
                                                    <div>
                                                        <h3 className="font-medium">/{page.slug}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Globe className="h-3 w-3" />
                                                            {Object.keys(page.languages || {}).map(l => l.toUpperCase()).join(', ')}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">W menu</span>
                                                        <Switch
                                                            checked={page.show_in_menu}
                                                            onCheckedChange={() => toggleMenuVisibility(page)}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(`/strona/${page.slug}`, '_blank')}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/admin/pages/${page.id}`)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => deletePage(page.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Create Page Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card rounded-2xl p-6 w-full max-w-md"
                        >
                            <h3 className="font-display text-xl font-bold mb-6">Nowa strona</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Tytuł strony</label>
                                    <Input
                                        value={newPageTitle}
                                        onChange={(e) => setNewPageTitle(e.target.value)}
                                        placeholder="np. O nas"
                                        data-testid="new-page-title"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Slug (URL)</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-muted-foreground">/strona/</span>
                                        <Input
                                            value={newPageSlug}
                                            onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            placeholder="o-nas"
                                            data-testid="new-page-slug"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tylko małe litery, cyfry i myślniki
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                        Anuluj
                                    </Button>
                                    <Button 
                                        onClick={createPage} 
                                        disabled={creating || !newPageSlug || !newPageTitle}
                                        data-testid="confirm-create-page"
                                    >
                                        {creating ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        Utwórz
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};
