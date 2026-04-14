import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BlockRenderer } from '../components/PageBuilder/BlockRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const DynamicPage = () => {
    const { slug } = useParams();
    const { language } = useLanguage();
    
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLang, setSelectedLang] = useState(language);

    useEffect(() => {
        fetchPage();
    }, [slug]);

    useEffect(() => {
        // Update selected language when global language changes
        if (page?.languages?.[language]) {
            setSelectedLang(language);
        }
    }, [language, page]);

    const fetchPage = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/api/pages/slug/${slug}`);
            setPage(response.data);
            
            // Select best language
            const langs = Object.keys(response.data.languages || {});
            if (langs.includes(language)) {
                setSelectedLang(language);
            } else if (langs.length > 0) {
                setSelectedLang(langs[0]);
            }
        } catch (err) {
            setError('Strona nie znaleziona');
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="fixed inset-0 grid-pattern -z-10" />
                <Header />
                <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
                    <h1 className="text-4xl font-display font-bold mb-4">404</h1>
                    <p className="text-muted-foreground mb-8">Strona nie znaleziona</p>
                    <Link to="/">
                        <Button>Wróć na stronę główną</Button>
                    </Link>
                </main>
            </div>
        );
    }

    const availableLanguages = Object.keys(page.languages || {});
    const currentLangData = page.languages[selectedLang] || page.languages[availableLanguages[0]] || { blocks: [] };

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="dynamic-page">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 min-h-screen pt-20 pb-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Language Switcher (if multiple languages) */}
                    {availableLanguages.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center mb-8"
                        >
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                {availableLanguages.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => setSelectedLang(lang)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedLang === lang 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'hover:bg-muted'
                                        }`}
                                    >
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Page Content */}
                    <motion.div
                        key={selectedLang}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentLangData.blocks?.map((block, index) => (
                            <motion.div
                                key={block.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <BlockRenderer block={block} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};
