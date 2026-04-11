import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Wrench } from 'lucide-react';
import { Header } from '../components/Header';
import { CountdownTimer } from '../components/CountdownTimer';
import { SocialLinks } from '../components/SocialLinks';
import { useLanguage } from '../contexts/LanguageContext';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png";

export const MaintenancePage = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="maintenance-page">
            {/* Background Effects */}
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            {/* Header */}
            <Header />

            {/* Main Content */}
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
                        className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/30"
                        data-testid="status-badge"
                    >
                        <Wrench className="h-4 w-4 text-primary animate-pulse" />
                        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase font-bold text-primary">
                            {t('status')}
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-center uppercase"
                        data-testid="main-heading"
                    >
                        <span className="text-gradient">{t('heading')}</span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-base sm:text-lg text-muted-foreground text-center max-w-2xl leading-relaxed"
                        data-testid="main-description"
                    >
                        {t('description')}
                    </motion.p>

                    {/* Countdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="w-full"
                    >
                        <CountdownTimer />
                    </motion.div>

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
