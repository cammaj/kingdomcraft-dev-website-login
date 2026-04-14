# KingdomCraft - PRD

## Problem Statement
Kompleksowy system zarządzania treścią dla serwera Minecraft KingdomCraft z:
- Page Builder typu WordPress (drag & drop)
- System kont użytkowników z autentykacją JWT + Google OAuth
- Panel administracyjny
- Tryb maintenance

## User Personas
- Gracze serwera KingdomCraft
- Administratorzy serwera tworzący treści

## Core Requirements
- Edytor stron z wizualizacją (WYSIWYG)
- Elementy: tekst, obrazy, przyciski, kontenery, galerie, video
- Wielojęzyczne strony (PL/EN/DE/...)
- Tworzenie/usuwanie podstron
- Strony specjalne (maintenance, home) - nieusuwalne

## What's Been Implemented (Kwiecień 2026)

### Faza 1 - Maintenance Page
- [x] Landing page z licznikiem odliczającym
- [x] Toggle ciemny/jasny motyw
- [x] Toggle język PL/EN
- [x] Przyciski social media
- [x] Strona regulaminu

### Faza 2 - System użytkowników
- [x] Logowanie JWT + Google OAuth
- [x] Rejestracja użytkowników
- [x] Strona profilu z uploadem avatara
- [x] Admin Panel (ustawienia, użytkownicy, newsy)
- [x] Maintenance mode blokuje login dla nie-adminów

### Faza 3 - Page Builder
- [x] Zarządzanie stronami (/admin/pages)
- [x] Strony specjalne: maintenance, home (nieusuwalne)
- [x] Tworzenie/usuwanie podstron
- [x] Page Editor z drag & drop (@dnd-kit)
- [x] Elementy: Nagłówek, Tekst, Obraz, Przycisk, Kontener, Galeria, Video, Odstęp
- [x] Panel właściwości bloku (tekst, styl, rozmiar, wyrównanie)
- [x] Wielojęzyczne wersje stron (PL, EN, DE, FR...)
- [x] Przełącznik języków na podstronach
- [x] Automatyczne menu nawigacyjne z podstron
- [x] Upload obrazów dla stron
- [x] Podgląd strony

## Credentials
- Admin: admin@kingdomcraft.pl / Admin123!

## Architecture
- Frontend: React + Tailwind + Shadcn/UI + Framer Motion + @dnd-kit
- Backend: FastAPI + MongoDB
- Auth: JWT cookies + Emergent Google OAuth

## Prioritized Backlog
### P0 - Critical
- Brak (MVP complete)

### P1 - High Priority
- Drag & drop sortowanie bloków (częściowo zaimplementowane)
- Galeria z wieloma obrazami

### P2 - Medium Priority
- Formularze kontaktowe
- SEO meta tags dla stron
- Wersjonowanie zmian stron

## Next Tasks
1. Uzupełnij prawdziwe linki do social media
2. Dodaj więcej stylizacji bloków (tło, obramowanie)
3. Rozważ integrację z Google Analytics
