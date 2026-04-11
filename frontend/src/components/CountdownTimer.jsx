import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const TARGET_DATE = new Date('2026-04-17T20:30:00');

const calculateTimeLeft = () => {
    const now = new Date();
    const difference = TARGET_DATE - now;

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isComplete: false
    };
};

const TimeCard = ({ value, label, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
                duration: 0.5, 
                delay: 0.1 * index,
                ease: "easeOut"
            }}
            className="countdown-card glass-card rounded-2xl p-4 sm:p-6 md:p-8 text-center glow-primary"
        >
            <motion.div 
                key={value}
                initial={{ scale: 1.1, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="font-display text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter tabular-nums text-gradient"
                data-testid={`countdown-${label.toLowerCase()}`}
            >
                {String(value).padStart(2, '0')}
            </motion.div>
            <div className="mt-2 sm:mt-4 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold text-muted-foreground">
                {label}
            </div>
        </motion.div>
    );
};

export const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);
    const { t } = useLanguage();

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (timeLeft.isComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
                data-testid="countdown-complete"
            >
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gradient">
                    {t('maintenance_complete')}
                </div>
            </motion.div>
        );
    }

    const timeUnits = [
        { value: timeLeft.days, label: t('days') },
        { value: timeLeft.hours, label: t('hours') },
        { value: timeLeft.minutes, label: t('minutes') },
        { value: timeLeft.seconds, label: t('seconds') }
    ];

    return (
        <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full max-w-4xl mx-auto"
            data-testid="countdown-timer"
        >
            {timeUnits.map((unit, index) => (
                <TimeCard 
                    key={unit.label} 
                    value={unit.value} 
                    label={unit.label} 
                    index={index}
                />
            ))}
        </div>
    );
};
