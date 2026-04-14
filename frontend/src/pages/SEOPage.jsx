import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Search, ArrowLeft, Globe, FileText, Link as LinkIcon, 
    CheckCircle, AlertCircle, ExternalLink, Copy, Loader2
} from 'lucide-react';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const FRONTEND_URL = process.env.REACT_APP_BACKEND_URL?.replace('/api', '') || window.location.origin;

export const SEOPage = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState('');

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/pages`);
            setPages(response.data);
        } catch (err) {
            console.error('Failed to fetch pages:', err);
        }
        setLoading(false);
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    const sitemapUrl = `${API_URL}/api/seo/sitemap.xml`;
    const robotsUrl = `${API_URL}/api/seo/robots.txt`;

    const seoTips = [
        {
            icon: FileText,
            title: 'Unikalne tytuły stron',
            description: 'Każda strona powinna mieć unikalny, opisowy tytuł (60-70 znaków).',
            status: 'tip'
        },
        {
            icon: Globe,
            title: 'Meta opisy',
            description: 'Dodaj opisy meta do każdej strony (150-160 znaków).',
            status: 'tip'
        },
        {
            icon: LinkIcon,
            title: 'Wewnętrzne linkowanie',
            description: 'Łącz strony między sobą, używając przycisków i linków w treści.',
            status: 'tip'
        },
        {
            icon: Search,
            title: 'Słowa kluczowe',
            description: 'Używaj naturalnie słów kluczowych w nagłówkach i treści.',
            status: 'tip'
        }
    ];

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="seo-page">
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
                        className="mb-8"
                    >
                        <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                            <Search className="h-8 w-8 text-primary" />
                            <span className="text-gradient">Ustawienia SEO</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Optymalizacja dla wyszukiwarek Google, Bing i innych.
                        </p>
                    </motion.div>

                    {/* Important Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                    >
                        {/* Sitemap */}
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Sitemap.xml
                                </h3>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Mapa strony dla robotów wyszukiwarek. Automatycznie aktualizowana.
                            </p>
                            <div className="flex gap-2">
                                <Input 
                                    value={sitemapUrl} 
                                    readOnly 
                                    className="text-sm bg-background/50"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(sitemapUrl, 'sitemap')}
                                >
                                    {copied === 'sitemap' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => window.open(sitemapUrl, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Robots.txt */}
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Robots.txt
                                </h3>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Instrukcje dla robotów wyszukiwarek. Automatycznie generowany.
                            </p>
                            <div className="flex gap-2">
                                <Input 
                                    value={robotsUrl} 
                                    readOnly 
                                    className="text-sm bg-background/50"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(robotsUrl, 'robots')}
                                >
                                    {copied === 'robots' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => window.open(robotsUrl, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* SEO Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <h2 className="font-display text-xl font-bold mb-4">Wskazówki SEO</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {seoTips.map((tip, idx) => (
                                <div key={idx} className="glass-card rounded-xl p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <tip.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium mb-1">{tip.title}</h3>
                                            <p className="text-sm text-muted-foreground">{tip.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Pages SEO Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="font-display text-xl font-bold mb-4">Status stron</h2>
                        <div className="glass-card rounded-xl overflow-hidden">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Strona</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">URL</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Języki</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">W menu</th>
                                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pages.map((page) => {
                                            const langs = Object.keys(page.languages || {});
                                            const title = page.languages?.[langs[0]]?.title || page.slug;
                                            const pageUrl = page.is_special 
                                                ? (page.slug === 'home' ? '/' : '/maintenance')
                                                : `/strona/${page.slug}`;
                                            
                                            return (
                                                <tr key={page.id} className="border-t border-border/50">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            {page.is_special && (
                                                                <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary">
                                                                    specjalna
                                                                </span>
                                                            )}
                                                            <span className="font-medium">{title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground text-sm font-mono">
                                                        {pageUrl}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-1">
                                                            {langs.map(lang => (
                                                                <span key={lang} className="px-2 py-0.5 rounded text-xs bg-muted">
                                                                    {lang.toUpperCase()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {page.show_in_menu ? (
                                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <Link to={`/admin/pages/${page.id}`}>
                                                            <Button size="sm" variant="ghost">
                                                                Edytuj
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>

                    {/* Google Search Console Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 glass-card rounded-xl p-6"
                    >
                        <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Dodaj do Google Search Console
                        </h3>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Przejdź do <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Search Console</a></li>
                            <li>Dodaj swoją domenę jako nową właściwość</li>
                            <li>Zweryfikuj własność domeny (przez DNS lub meta tag)</li>
                            <li>Prześlij adres sitemap: <code className="bg-muted px-2 py-0.5 rounded">{sitemapUrl}</code></li>
                            <li>Monitoruj indeksowanie i błędy crawlera</li>
                        </ol>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};
