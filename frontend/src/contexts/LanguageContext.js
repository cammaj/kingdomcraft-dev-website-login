import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const translations = {
    pl: {
        // Maintenance page
        status: "STATUS SYSTEMU",
        heading: "PRZERWA KONSERWACYJNA",
        description: "Serwer KingdomCraft jest obecnie w trakcie przerwy technicznej. Tworzymy dla Was epickie nowości. Wracamy wkrótce!",
        days: "DNI",
        hours: "GODZINY",
        minutes: "MINUTY",
        seconds: "SEKUNDY",
        social_cta: "Dołącz do społeczności",
        rules_link: "Regulamin serwera",
        back_home: "Wróć na stronę główną",
        maintenance_complete: "Serwer jest już dostępny!",
        
        // Rules page
        rules_title: "REGULAMIN SERWERA",
        rules_intro: "Zapoznaj się z zasadami obowiązującymi na serwerze KingdomCraft.",
        rule_1_title: "1. Szacunek dla innych graczy",
        rule_1_desc: "Traktuj innych graczy z szacunkiem. Zabrania się obrażania, nękania, dyskryminacji oraz wszelkich form toksycznego zachowania.",
        rule_2_title: "2. Zakaz oszustw",
        rule_2_desc: "Używanie cheatów, exploitów, modyfikacji dających nieuczciwą przewagę jest surowo zabronione i karane banem.",
        rule_3_title: "3. Ochrona budowli",
        rule_3_desc: "Niszczenie, kradzież lub modyfikacja cudzych budowli bez zgody właściciela jest zabroniona.",
        rule_4_title: "4. Spam i reklama",
        rule_4_desc: "Zabrania się spamowania na czacie oraz reklamowania innych serwerów, stron czy usług.",
        rule_5_title: "5. Nazwy i skiny",
        rule_5_desc: "Nazwy użytkowników i skiny nie mogą zawierać treści wulgarnych, obraźliwych lub nieodpowiednich.",
        rule_6_title: "6. Współpraca z administracją",
        rule_6_desc: "Decyzje administracji są ostateczne. Próby obchodzenia kar skutkują ich zaostrzeniem.",
        last_updated: "Ostatnia aktualizacja: Styczeń 2025",
        
        // Auth
        login: "Zaloguj się",
        register: "Zarejestruj się",
        logout: "Wyloguj się",
        email: "Email",
        password: "Hasło",
        username: "Nazwa użytkownika",
        login_with_google: "Zaloguj przez Google",
        no_account: "Nie masz konta?",
        have_account: "Masz już konto?",
        
        // Home page
        server_online: "SERWER ONLINE",
        welcome: "Witaj na KingdomCraft!",
        welcome_desc: "Serwer jest aktywny. Dołącz do naszej społeczności!",
        latest_news: "Najnowsze aktualności",
        no_news: "Brak aktualności",
        
        // Profile
        my_profile: "Mój profil",
        edit_profile: "Edytuj profil",
        save: "Zapisz",
        cancel: "Anuluj",
        change_avatar: "Zmień avatar",
        
        // Admin
        admin_panel: "Panel administracyjny",
        users: "Użytkownicy",
        settings: "Ustawienia",
        news_management: "Zarządzanie aktualnościami",
        maintenance_mode: "Tryb konserwacji",
        maintenance_enabled: "Włączony",
        maintenance_disabled: "Wyłączony",
        countdown_date: "Data końca konserwacji",
        maintenance_text: "Tekst nagłówka",
        maintenance_desc: "Opis",
        add_user: "Dodaj użytkownika",
        add_news: "Dodaj aktualność",
        edit: "Edytuj",
        delete: "Usuń",
        role: "Rola",
        created_at: "Data utworzenia",
        actions: "Akcje",
        title: "Tytuł",
        content: "Treść"
    },
    en: {
        // Maintenance page
        status: "SYSTEM STATUS",
        heading: "SERVER MAINTENANCE",
        description: "KingdomCraft is currently undergoing scheduled maintenance. We are building epic new features for you. We will be back soon!",
        days: "DAYS",
        hours: "HOURS",
        minutes: "MINUTES",
        seconds: "SECONDS",
        social_cta: "Join our community",
        rules_link: "Rules & Regulations",
        back_home: "Back to Home",
        maintenance_complete: "Server is now available!",
        
        // Rules page
        rules_title: "SERVER RULES",
        rules_intro: "Please read and follow the rules that apply on KingdomCraft server.",
        rule_1_title: "1. Respect Other Players",
        rule_1_desc: "Treat all players with respect. Insults, harassment, discrimination and any form of toxic behavior is prohibited.",
        rule_2_title: "2. No Cheating",
        rule_2_desc: "Using cheats, exploits, or modifications that give unfair advantages is strictly forbidden and will result in a ban.",
        rule_3_title: "3. Building Protection",
        rule_3_desc: "Destroying, stealing from, or modifying other players' builds without permission is prohibited.",
        rule_4_title: "4. Spam & Advertising",
        rule_4_desc: "Spamming chat and advertising other servers, websites, or services is not allowed.",
        rule_5_title: "5. Names & Skins",
        rule_5_desc: "Usernames and skins must not contain vulgar, offensive, or inappropriate content.",
        rule_6_title: "6. Cooperation with Staff",
        rule_6_desc: "Staff decisions are final. Attempting to circumvent punishments will result in harsher penalties.",
        last_updated: "Last updated: January 2025",
        
        // Auth
        login: "Log In",
        register: "Sign Up",
        logout: "Log Out",
        email: "Email",
        password: "Password",
        username: "Username",
        login_with_google: "Continue with Google",
        no_account: "Don't have an account?",
        have_account: "Already have an account?",
        
        // Home page
        server_online: "SERVER ONLINE",
        welcome: "Welcome to KingdomCraft!",
        welcome_desc: "The server is active. Join our community!",
        latest_news: "Latest News",
        no_news: "No news available",
        
        // Profile
        my_profile: "My Profile",
        edit_profile: "Edit Profile",
        save: "Save",
        cancel: "Cancel",
        change_avatar: "Change Avatar",
        
        // Admin
        admin_panel: "Admin Panel",
        users: "Users",
        settings: "Settings",
        news_management: "News Management",
        maintenance_mode: "Maintenance Mode",
        maintenance_enabled: "Enabled",
        maintenance_disabled: "Disabled",
        countdown_date: "Countdown End Date",
        maintenance_text: "Heading Text",
        maintenance_desc: "Description",
        add_user: "Add User",
        add_news: "Add News",
        edit: "Edit",
        delete: "Delete",
        role: "Role",
        created_at: "Created At",
        actions: "Actions",
        title: "Title",
        content: "Content"
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('kdc-language');
        return saved || 'pl';
    });
    
    const [siteSettings, setSiteSettings] = useState(null);

    useEffect(() => {
        localStorage.setItem('kdc-language', language);
    }, [language]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/settings`);
            setSiteSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const t = (key) => {
        // Check for dynamic settings first
        if (siteSettings) {
            if (key === 'heading' && siteSettings[`maintenance_text_${language}`]) {
                return siteSettings[`maintenance_text_${language}`];
            }
            if (key === 'description' && siteSettings[`maintenance_description_${language}`]) {
                return siteSettings[`maintenance_description_${language}`];
            }
        }
        return translations[language][key] || key;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'pl' ? 'en' : 'pl');
    };

    return (
        <LanguageContext.Provider value={{ 
            language, 
            setLanguage, 
            toggleLanguage, 
            t, 
            siteSettings,
            fetchSettings 
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
