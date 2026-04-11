import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    pl: {
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
        maintenance_complete: "Serwer jest już dostępny!"
    },
    en: {
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
        maintenance_complete: "Server is now available!"
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('kdc-language');
        return saved || 'pl';
    });

    useEffect(() => {
        localStorage.setItem('kdc-language', language);
    }, [language]);

    const t = (key) => translations[language][key] || key;

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'pl' ? 'en' : 'pl');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
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
