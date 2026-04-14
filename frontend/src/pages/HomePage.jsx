import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Zap, Newspaper } from 'lucide-react';
import axios from 'axios';
import { Header } from '../components/Header';
import { SocialLinks } from '../components/SocialLinks';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png";

export const HomePage = () => {
    const { t, language } = useLanguage();
    const [news, setNews] = useState([]);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/news`);
            setNews(response.data.slice(0, 3));
        } catch (error) {
            console.error('Failed to fetch news:', error);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="home-page">
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            <Header />

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-12">
                <div className="max-w-5xl mx-auto w-full flex flex-col items-center gap-8 sm:gap-12">
                    
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative"
                    >
                        <img 
                            src={LOGO_URL} 
                            alt="KingdomCraft Logo" 
                            className="h-24 sm:h-32 md:h-40 w-auto logo-glow"
                            data-testid="main-logo"
                        />
                        <div className="absolute inset-0 blur-3xl opacity-30 bg-primary rounded-full" />
                    </motion.div>

                    {/* Status Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-green-500/30"
                        data-testid="status-badge"
                    >
                        <Zap className="h-4 w-4 text-green-500 animate-pulse" />
                        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase font-bold text-green-500">
                            {t('server_online')}
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-center"
                        data-testid="main-heading"
                    >
                        <span className="text-gradient">{t('welcome')}</span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-base sm:text-lg text-muted-foreground text-center max-w-2xl leading-relaxed"
                        data-testid="main-description"
                    >
                        {t('welcome_desc')}
                    </motion.p>

                    {/* News Section */}
                    {news.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="w-full max-w-3xl"
                        >
                            <h2 className="font-display text-xl sm:text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                                <Newspaper className="h-5 w-5 text-primary" />
                                {t('latest_news')}
                            </h2>
                            <div className="space-y-4">
                                {news.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                                        className="glass-card rounded-xl p-5 glow-primary"
                                        data-testid={`news-item-${index}`}
                                    >
                                        <h3 className="font-display font-bold text-lg mb-2">
                                            {language === 'pl' ? item.title_pl : item.title_en}
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-2">
                                            {language === 'pl' ? item.content_pl : item.content_en}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {item.author_name} • {new Date(item.created_at).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Social Links */}
                    <SocialLinks />

                    {/* Rules Link */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                    >
                        <Link
                            to="/rules"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                            data-testid="rules-link"
                        >
                            <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span className="border-b border-transparent group-hover:border-primary transition-colors">
                                {t('rules_link')}
                            </span>
                        </Link>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};
