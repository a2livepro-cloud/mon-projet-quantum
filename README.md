# QUANTUM

Plateforme SaaS communautaire de recrutement spécialisée en ingénierie mécanique.

## Stack

- **Framework** : Next.js 14 (App Router)
- **Styling** : Tailwind CSS + composants type shadcn/ui
- **Base de données** : Supabase (PostgreSQL)
- **Auth & rôles** : Supabase Auth
- **Temps réel (tchat)** : Supabase Realtime
- **Matching IA** : OpenAI API (text-embedding-3-small) + pgvector
- **Déploiement** : Vercel
- **Langue** : Français

## Design

- Mode dark exclusif
- Couleurs : `#080B12` (bg), `#0E1420` (surface), `#3B82F6` (accent), `#06B6D4` (cyan), `#F59E0B` (gold)
- Typographie : Syne (titres), DM Sans (corps)

## Setup

### 1. Dépendances

```bash
npm install
```

### 2. Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner :

- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : clé anon Supabase
- `OPENAI_API_KEY` : clé API OpenAI (pour les embeddings)

### 3. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Activer l’extension **pgvector** (Database → Extensions).
3. Exécuter les migrations dans l’ordre (SQL Editor) :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_match_function.sql`
4. Activer **Realtime** pour la table `messages` (Database → Replication).
5. Dans Authentication → Providers, activer Email et configurer selon besoin (confirmations, etc.).
6. Créer manuellement le premier admin : après inscription d’un compte, en base mettre `role = 'admin'` et `status = 'approved'` sur la ligne correspondante dans `profiles`.

### 4. Lancer l’app

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Rôles & parcours

- **Candidat** : inscription → en attente → après validation : profil, communauté (tchat), grades/XP. Pas d’accès direct aux offres ; matching côté client uniquement.
- **Client** : inscription → en attente → après validation : dépôt de fiches de poste, dashboard, matching (CV anonymisés), bouton « Je veux aller plus loin » (notification admin).
- **Admin** : validation des comptes candidat/client, vue complète des profils, fiches, matchings, placements.

## Sécurité

- RLS activé sur toutes les tables Supabase.
- Candidat : accès uniquement à son profil.
- Client : uniquement ses fiches et les matchings associés (données anonymisées).
- Admin : accès complet.
- Embeddings et CV non exposés côté client.

## Déploiement Vercel

1. Importer le repo sur Vercel.
2. Configurer les variables d’environnement (Supabase + OpenAI).
3. Déployer. Les migrations Supabase restent à exécuter manuellement sur le projet Supabase de prod.

## Licence

Privé / usage interne.
