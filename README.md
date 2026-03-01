# QUANTUM — Plateforme de recrutement ingénierie mécanique

Plateforme communautaire de mise en relation entre ingénieurs mécaniques (candidats) et entreprises/cabinets de recrutement (clients), avec système de matching IA, grades & XP, et programme de parrainage.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| Base de données | Supabase (PostgreSQL + RLS + pgvector) |
| Auth | Supabase Auth |
| Temps réel | Supabase Realtime (chat) |
| Stockage fichiers | Supabase Storage |
| Styling | Tailwind CSS |
| UI Components | Radix UI (shadcn/ui style) |
| CAPTCHA | Cloudflare Turnstile |
| IA / Matching | Embeddings IA + pgvector |
| Déploiement | Vercel |
| Langue | Français |

---

## Design system

- Mode **dark exclusif**
- `#080B12` — bg principal
- `#0E1420` — surface / sidebar
- `#3B82F6` — accent bleu (clients)
- `#06B6D4` — cyan (candidats)
- `#F59E0B` — gold (grades)
- Typographie : **Syne** (titres) · **DM Sans** (corps)

---

## Architecture des rôles

```
Visiteur → Inscription (+ CAPTCHA) → Compte "pending" → Validation admin → Accès plateforme
                                                               ↕
                                                         Refus possible
```

Trois rôles distincts :

- **Candidat** — ingénieur mécanique cherchant des missions
- **Client** — entreprise ou cabinet déposant des fiches de poste
- **Admin** — équipe QUANTUM gérant les validations et matchings

---

## Pages et fonctionnalités

### Public
| Route | Description |
|-------|-------------|
| `/` | Landing page avec animation réseau canvas |
| `/choisir` | Sélection du type de compte |
| `/connexion` | Connexion unifiée, redirection automatique par rôle |
| `/inscription/candidat` | Formulaire (CV optionnel recommandé, CAPTCHA Turnstile) |
| `/inscription/client` | Formulaire (CAPTCHA Turnstile) |
| `/inscription/admin` | Formulaire avec code secret |

### Espace Candidat (`/candidat/*`)
| Route | Description |
|-------|-------------|
| `/candidat/profil` | Profil, compétences, taux de complétion, code parrainage |
| `/candidat/communaute` | Chat room communautaire temps réel |
| `/candidat/grades` | Grades & XP, barre de progression vers le prochain grade |
| `/candidat/parrainage` | Code parrainage, stats, historique |

### Espace Client (`/client/*`)
| Route | Description |
|-------|-------------|
| `/client/dashboard` | Vue d'ensemble |
| `/client/fiches` | Liste des fiches de poste |
| `/client/fiches/nouvelle` | Création d'une fiche de poste |
| `/client/matching/[ficheId]` | Résultats IA de matching candidats |
| `/client/communaute` | Chat room communautaire temps réel |
| `/client/grades` | Grades & XP |
| `/client/parrainage` | Code parrainage, stats, historique |
| `/client/parametres` | Paramètres du compte |

### Espace Admin (`/admin/*`)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard général |
| `/admin/candidats` | Liste, validation/refus, lecture CV, notes internes |
| `/admin/clients` | Liste, validation/refus, notes internes |
| `/admin/matchings` | Supervision des matchings |
| `/admin/placements` | Suivi des placements |

---

## Système de grades

| Grade | XP requis | Avantage |
|-------|-----------|----------|
| Recrue | 0 | — |
| Membre | 500 | — |
| Confirmé | 1 500 | — |
| Pionnier | 3 000 | Invitation sortie annuelle |
| Ambassadeur | 5 000 | Dîner privé + sortie annuelle |

XP gagnés par : complétion du profil, parrainage validé (+200 XP par filleul).

---

## Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev
# → http://localhost:3000

# Build production
npm run build
```

---

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner les valeurs :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# IA (matching)
ANTHROPIC_API_KEY=sk-ant-...

# Code secret pour la création de compte admin
ADMIN_INVITE_CODE=votre-code-secret

# Cloudflare Turnstile CAPTCHA
# Générer sur https://dash.cloudflare.com > Application security > Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

> Ne jamais commiter `.env.local` — il est exclu par `.gitignore`.

---

## Setup Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Activer l'extension **pgvector** (Database → Extensions)
3. Exécuter les migrations dans l'ordre (SQL Editor) :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_match_function.sql`
4. Activer **Realtime** pour la table `messages` (Database → Replication)
5. Créer le bucket de stockage **`cvs`** (Storage → New bucket, privé, limite 5 Mo)
6. **Premier admin** : après inscription, mettre manuellement `role = 'admin'` et `status = 'approved'` dans la table `profiles`

---

## Sécurité

- **RLS** activé sur toutes les tables — aucun accès non autorisé possible
- **`service_role`** utilisé uniquement dans les API routes Next.js (jamais exposé côté client)
- **Bucket `cvs` privé** — CVs accessibles aux admins uniquement via URL signée (1h d'expiration)
- **CAPTCHA Turnstile** sur tous les formulaires d'inscription
- **`.env.local` exclu** du dépôt git

---

## Structure du projet

```
src/
├── app/
│   ├── admin/              # Espace administrateur
│   │   ├── candidats/      # Gestion candidats (+ lecture CV)
│   │   └── clients/        # Gestion clients
│   ├── candidat/           # Espace candidat (sidebar cyan)
│   ├── client/             # Espace client (sidebar bleu)
│   ├── inscription/        # Formulaires d'inscription
│   ├── connexion/          # Page de connexion
│   ├── api/                # API routes Next.js
│   │   └── admin/
│   │       ├── validate-profile/   # Validation / refus comptes
│   │       └── cv-url/             # URL signée pour accès CV admin
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # Composants Radix UI
│   ├── chat/               # Chat room temps réel
│   └── network-background.tsx
├── lib/
│   └── supabase/
│       ├── client.ts       # Client navigateur (anon key)
│       ├── server.ts       # Client serveur (cookies)
│       └── admin.ts        # Client admin (service role — serveur uniquement)
└── types/
    └── database.ts         # Types et labels métier
```

---

## Déploiement Vercel

1. Importer le dépôt sur [vercel.com](https://vercel.com)
2. Configurer toutes les variables d'environnement dans les Settings Vercel
3. Déployer — les migrations Supabase restent à exécuter manuellement en production

---

## Licence

Privé / usage interne QUANTUM.
