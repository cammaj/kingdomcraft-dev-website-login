import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Languages, User, LogOut, Shield, Menu, X } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png";

export const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage, t, siteSettings } = useLanguage();
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    
    const [menuPages, setMenuPages] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchMenuPages();
    }, []);

    const fetchMenuPages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/pages/menu`);
            setMenuPages(response.data);
        } catch (error) {
            console.error('Failed to fetch menu pages:', error);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getPageTitle = (page) => {
        if (page.languages?.[language]?.title) {
            return page.languages[language].title;
        }
        const firstLang = Object.keys(page.languages || {})[0];
        return page.languages?.[firstLang]?.title || page.slug;
    };

    // Don't show menu in maintenance mode for non-admins
    const showNavigation = !siteSettings?.maintenance_mode || isAdmin;

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
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link 
                        to="/"
                        className="flex items-center gap-3"
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
                    </Link>
                </motion.div>

                {/* Navigation - Desktop */}
                {showNavigation && menuPages.length > 0 && (
                    <nav className="hidden md:flex items-center gap-1">
                        {menuPages.map(page => (
                            <Link
                                key={page.id}
                                to={`/strona/${page.slug}`}
                                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                {getPageTitle(page)}
                            </Link>
                        ))}
                    </nav>
                )}

                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Mobile Menu Button */}
                    {showNavigation && menuPages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    )}

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

                    {/* User Menu or Login */}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-primary/30 hover:border-primary/60 hover:bg-primary/10"
                                    data-testid="user-menu-trigger"
                                >
                                    {user?.profile_picture ? (
                                        <img 
                                            src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`} 
                                            alt="Avatar" 
                                            className="h-6 w-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-4 w-4" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5 text-sm font-medium">
                                    {user?.username}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="profile-menu-item">
                                    <User className="h-4 w-4 mr-2" />
                                    {t('my_profile')}
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="admin-menu-item">
                                        <Shield className="h-4 w-4 mr-2" />
                                        {t('admin_panel')}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-menu-item">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    {t('logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate('/login')}
                            className="bg-primary hover:bg-primary/90"
                            data-testid="login-btn"
                        >
                            {t('login')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Mobile Navigation */}
            {showNavigation && mobileMenuOpen && menuPages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl"
                >
                    <nav className="px-4 py-3 space-y-1">
                        {menuPages.map(page => (
                            <Link
                                key={page.id}
                                to={`/strona/${page.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                                {getPageTitle(page)}
                            </Link>
                        ))}
                    </nav>
                </motion.div>
            )}
        </motion.header>
    );
};
