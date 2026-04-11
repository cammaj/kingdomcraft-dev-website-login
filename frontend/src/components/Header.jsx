import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png";

export const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage();

    return (
        <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40"
            data-testid="header"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <motion.a 
                    href="/"
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid="logo-link"
                >
                    <img 
                        src={LOGO_URL} 
                        alt="KingdomCraft Logo" 
                        className="h-10 w-10 logo-glow"
                    />
                    <span className="font-display font-bold text-lg sm:text-xl tracking-tight hidden sm:block">
                        KingdomCraft
                    </span>
                </motion.a>

                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Language Toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all"
                        data-testid="language-toggle"
                    >
                        <Languages className="h-4 w-4" />
                        <span className="font-medium text-sm">{language.toUpperCase()}</span>
                    </Button>

                    {/* Theme Toggle */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        className="border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all theme-toggle"
                        data-testid="theme-toggle"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4 text-yellow-400" />
                        ) : (
                            <Moon className="h-4 w-4 text-primary" />
                        )}
                    </Button>
                </div>
            </div>
        </motion.header>
    );
};
