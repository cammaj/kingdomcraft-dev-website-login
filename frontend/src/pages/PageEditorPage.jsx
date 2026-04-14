import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Save, Loader2, Plus, Globe, Eye, Trash2
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageBuilder } from '../components/PageBuilder';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const PageEditorPage = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [selectedLang, setSelectedLang] = useState('pl');
    const [showAddLang, setShowAddLang] = useState(false);
    const [newLang, setNewLang] = useState('');

    useEffect(() => {
        fetchPage();
    }, [pageId]);

    const fetchPage = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/pages/${pageId}`, { withCredentials: true });
            setPage(response.data);
            // Set first available language
            const langs = Object.keys(response.data.languages || {});
            if (langs.length > 0 && !langs.includes(selectedLang)) {
                setSelectedLang(langs[0]);
            }
        } catch (err) {
            setError('Nie udało się załadować strony');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await axios.put(`${API_URL}/api/admin/pages/${pageId}`, {
                languages: page.languages,
                slug: page.slug,
                show_in_menu: page.show_in_menu,
                menu_order: page.menu_order
            }, { withCredentials: true });
            setSuccess('Zapisano!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Błąd podczas zapisywania');
        }
        setSaving(false);
    };

    const updateBlocks = (newBlocks) => {
        setPage(prev => ({
            ...prev,
            languages: {
                ...prev.languages,
                [selectedLang]: {
                    ...prev.languages[selectedLang],
                    blocks: newBlocks
                }
            }
        }));
    };

    const updateTitle = (title) => {
        setPage(prev => ({
            ...prev,
            languages: {
                ...prev.languages,
                [selectedLang]: {
                    ...prev.languages[selectedLang],
                    title
                }
            }
        }));
    };

    const addLanguage = () => {
        if (!newLang || page.languages[newLang]) return;
        
        setPage(prev => ({
            ...prev,
            languages: {
                ...prev.languages,
                [newLang]: {
                    title: `Strona (${newLang.toUpperCase()})`,
                    blocks: []
                }
            }
        }));
        setSelectedLang(newLang);
        setNewLang('');
        setShowAddLang(false);
    };

    const removeLanguage = (lang) => {
        if (Object.keys(page.languages).length <= 1) {
            setError('Strona musi mieć przynajmniej jedną wersję językową');
            return;
        }
        
        const newLangs = { ...page.languages };
        delete newLangs[lang];
        
        setPage(prev => ({
            ...prev,
            languages: newLangs
        }));
        
        if (selectedLang === lang) {
            setSelectedLang(Object.keys(newLangs)[0]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!page) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-destructive">Strona nie znaleziona</p>
            </div>
        );
    }

    const availableLanguages = Object.keys(page.languages || {});
    const currentLangData = page.languages[selectedLang] || { title: '', blocks: [] };

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="page-editor">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 pt-20 pb-12 px-4 sm:px-6 h-screen flex flex-col">
                <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
                    {/* Top Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-4 flex-shrink-0"
                    >
                        <div className="flex items-center gap-4">
                            <Link
                                to="/admin/pages"
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Wróć
                            </Link>
                            <div>
                                <h1 className="font-display text-xl font-bold">
                                    {page.is_special ? (
                                        <span className="text-primary">{page.slug === 'maintenance' ? 'Strona Maintenance' : 'Strona Główna'}</span>
                                    ) : (
                                        <span>Edycja: /{page.slug}</span>
                                    )}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Language Selector */}
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                {availableLanguages.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => setSelectedLang(lang)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            selectedLang === lang 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'hover:bg-muted'
                                        }`}
                                        data-testid={`lang-tab-${lang}`}
                                    >
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowAddLang(true)}
                                    className="px-2 py-1.5 rounded-md text-sm hover:bg-muted"
                                    data-testid="add-lang-btn"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Preview Button */}
                            <Button
                                variant="outline"
                                onClick={() => window.open(`/preview/${page.slug}/${selectedLang}`, '_blank')}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Podgląd
                            </Button>

                            {/* Save Button */}
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90"
                                data-testid="save-page-btn"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Zapisz
                            </Button>
                        </div>
                    </motion.div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex-shrink-0">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm flex-shrink-0">
                            {success}
                        </div>
                    )}

                    {/* Title Editor */}
                    <div className="mb-4 flex items-center gap-4 flex-shrink-0">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                Tytuł strony ({selectedLang.toUpperCase()})
                            </label>
                            <Input
                                value={currentLangData.title || ''}
                                onChange={(e) => updateTitle(e.target.value)}
                                placeholder="Tytuł strony"
                                className="bg-background/50"
                                data-testid="page-title-input"
                            />
                        </div>
                        {availableLanguages.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive mt-6"
                                onClick={() => removeLanguage(selectedLang)}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Usuń {selectedLang.toUpperCase()}
                            </Button>
                        )}
                    </div>

                    {/* Page Builder */}
                    <div className="flex-1 min-h-0">
                        <PageBuilder
                            blocks={currentLangData.blocks || []}
                            onChange={updateBlocks}
                            language={selectedLang}
                        />
                    </div>
                </div>

                {/* Add Language Modal */}
                {showAddLang && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card rounded-2xl p-6 w-full max-w-sm"
                        >
                            <h3 className="font-display text-lg font-bold mb-4">Dodaj wersję językową</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Kod języka</label>
                                    <Input
                                        value={newLang}
                                        onChange={(e) => setNewLang(e.target.value.toLowerCase())}
                                        placeholder="np. de, fr, es"
                                        maxLength={5}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Użyj kodu ISO (pl, en, de, fr, es, it...)
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setShowAddLang(false)}>
                                        Anuluj
                                    </Button>
                                    <Button onClick={addLanguage} disabled={!newLang}>
                                        Dodaj
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
