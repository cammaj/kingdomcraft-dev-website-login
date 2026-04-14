# KingdomCraft - PRD

## Problem Statement
Rozbudowa landing page KingdomCraft o:
- Admin panel (edycja kont, switch maintenance/running, edycja tekstów maintenance)
- System kont użytkowników (email, hasło, username, zdjęcie profilowe)
- Strona główna (gdy serwer działa)
- Strona profilu użytkownika

## User Personas
- Gracze serwera KingdomCraft
- Administratorzy serwera

## Core Requirements
- Autentykacja: JWT + Google OAuth
- Rejestracja: użytkownicy mogą się sami rejestrować + admin może tworzyć konta
- Admin panel z zarządzaniem użytkownikami, ustawieniami, aktualnościami

## What's Been Implemented (Kwiecień 2026)

### Faza 1 - Maintenance Page
- [x] Landing page z informacją o przerwie konserwacyjnej
- [x] Licznik odliczający (dynamiczna data z settings)
- [x] Toggle ciemny/jasny motyw
- [x] Toggle język PL/EN
- [x] Przyciski social media (Discord, TikTok, YouTube)
- [x] Strona regulaminu

### Faza 2 - System użytkowników i Admin Panel
- [x] Logowanie JWT (email/hasło)
- [x] Logowanie Google OAuth (Emergent Auth)
- [x] Rejestracja użytkowników
- [x] Strona profilu (edycja username, email)
- [x] Upload zdjęcia profilowego
- [x] Admin Panel - zakładka Ustawienia (maintenance mode, countdown date, teksty PL/EN)
- [x] Admin Panel - zakładka Użytkownicy (lista, dodawanie, edycja, usuwanie)
- [x] Admin Panel - zakładka Aktualności (dodawanie, usuwanie)
- [x] Strona główna (gdy serwer online) z newsami
- [x] Menu użytkownika w headerze (dropdown)
- [x] Maintenance mode: niezalogowani widzą maintenance, admin widzi pełną stronę

## Credentials
- Admin: admin@kingdomcraft.pl / Admin123!

## Prioritized Backlog
### P0 - Critical
- Brak (MVP complete)

### P1 - High Priority
- Dodać prawdziwe linki do social media

### P2 - Medium Priority
- Password reset functionality
- Email notifications
- User avatar upload optimization

## Next Tasks
1. Uzupełnić linki do Discord, TikTok, YouTube
2. Dodać funkcję resetowania hasła
3. Rozważyć statystyki serwera na stronie głównej
