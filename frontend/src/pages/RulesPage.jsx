import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Ban, MessageSquare, User, Gavel } from 'lucide-react';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';

const ruleIcons = [Users, Ban, Shield, MessageSquare, User, Gavel];

export const RulesPage = () => {
    const { t } = useLanguage();

    const rules = [
        { title: t('rule_1_title'), desc: t('rule_1_desc') },
        { title: t('rule_2_title'), desc: t('rule_2_desc') },
        { title: t('rule_3_title'), desc: t('rule_3_desc') },
        { title: t('rule_4_title'), desc: t('rule_4_desc') },
        { title: t('rule_5_title'), desc: t('rule_5_desc') },
        { title: t('rule_6_title'), desc: t('rule_6_desc') }
    ];

    return (
        <div className="min-h-screen relative overflow-hidden" data-testid="rules-page">
            {/* Background Effects */}
            <div className="fixed inset-0 grid-pattern -z-10" />
            <div className="ambient-glow" />
            
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="relative z-10 min-h-screen pt-24 pb-12 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Back Link */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group mb-8"
                            data-testid="back-home-link"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span>{t('back_home')}</span>
                        </Link>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-center mb-4"
                        data-testid="rules-title"
                    >
                        <span className="text-gradient">{t('rules_title')}</span>
                    </motion.h1>

                    {/* Intro */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base sm:text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto"
                        data-testid="rules-intro"
                    >
                        {t('rules_intro')}
                    </motion.p>

                    {/* Rules List */}
                    <div className="space-y-4 sm:space-y-6">
                        {rules.map((rule, index) => {
                            const Icon = ruleIcons[index];
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                    className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 glow-primary"
                                    data-testid={`rule-${index + 1}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-display text-base sm:text-lg font-bold mb-2 tracking-tight">
                                                {rule.title}
                                            </h3>
                                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                                {rule.desc}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Last Updated */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="text-center text-xs sm:text-sm text-muted-foreground mt-12"
                        data-testid="rules-last-updated"
                    >
                        {t('last_updated')}
                    </motion.p>
                </div>
            </main>
        </div>
    );
};
