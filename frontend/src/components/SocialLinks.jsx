import React from 'react';
import { motion } from 'framer-motion';
import { FaDiscord, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const socialLinks = [
    {
        name: 'Discord',
        icon: FaDiscord,
        url: '#',
        color: 'hover:text-[#5865F2]',
        testId: 'social-discord'
    },
    {
        name: 'TikTok',
        icon: FaTiktok,
        url: '#',
        color: 'hover:text-[#ff0050]',
        testId: 'social-tiktok'
    },
    {
        name: 'YouTube',
        icon: FaYoutube,
        url: '#',
        color: 'hover:text-[#FF0000]',
        testId: 'social-youtube'
    }
];

export const SocialLinks = () => {
    const { t } = useLanguage();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col items-center gap-6"
            data-testid="social-links"
        >
            <p className="text-sm tracking-[0.15em] uppercase font-semibold text-muted-foreground">
                {t('social_cta')}
            </p>
            
            <div className="flex items-center gap-3 sm:gap-4">
                {socialLinks.map((social, index) => (
                    <motion.a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`social-btn glass-card rounded-xl p-3 sm:p-4 flex items-center justify-center border border-primary/20 ${social.color} transition-colors`}
                        data-testid={social.testId}
                        aria-label={social.name}
                    >
                        <social.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
};
