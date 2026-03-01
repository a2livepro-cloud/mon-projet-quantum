export type ProfileRole = "candidat" | "client" | "admin";
export type ProfileStatus = "pending" | "approved" | "rejected";

export type SecteurCandidat =
  | "aeronautique"
  | "automobile"
  | "energie"
  | "robotique"
  | "industrie"
  | "bureau_etudes";

export type AnneesExperience = "0-2" | "3-5" | "6-10" | "10+";
export type Disponibilite = "immediate" | "1_mois" | "3_mois" | "veille";

export type Grade = "recrue" | "membre" | "confirme" | "pionnier" | "ambassadeur";

export type MatchingSource = "reseau_jeff" | "beetween" | "sourcing_allan";
export type MatchingStatut = "suggested" | "viewed" | "interested" | "placed";

export type ReferralStatus = "pending" | "validated";

export interface Profile {
  id: string;
  role: ProfileRole;
  status: ProfileStatus;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export interface Candidat {
  id: string;
  secteur: SecteurCandidat | null;
  secteurs: SecteurCandidat[];
  secteurs_valides: SecteurCandidat[];
  annees_experience: AnneesExperience | null;
  disponibilite: Disponibilite | null;
  competences: string[];
  cv_url: string | null;
  referral_code: string | null;
  referred_by: string | null;
  xp: number;
  grade: Grade;
  embedding?: number[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  nom_entreprise: string | null;
  secteur_activite: string | null;
  taille_entreprise: string | null;
  secteurs: SecteurCandidat[];
  secteurs_valides: SecteurCandidat[];
  referral_code: string | null;
  referred_by: string | null;
  xp: number;
  grade: Grade;
  created_at?: string;
  updated_at?: string;
}

export interface FichePoste {
  id: string;
  client_id: string;
  titre: string | null;
  description: string | null;
  secteur: string | null;
  competences_requises: string[];
  localisation: string | null;
  type_contrat: string | null;
  statut: "active" | "closed";
  embedding?: number[] | null;
  created_at: string;
}

export interface Matching {
  id: string;
  fiche_id: string;
  candidat_id: string;
  score: number;
  source: MatchingSource;
  statut: MatchingStatut;
  created_at: string;
}

export interface XpLog {
  id: string;
  user_id: string;
  action: string;
  points: number;
  created_at: string;
}

export interface Message {
  id: string;
  channel: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: ReferralStatus;
  xp_awarded: boolean;
  created_at: string;
}

export const GRADE_THRESHOLDS: Record<Grade, number> = {
  recrue: 0,
  membre: 500,
  confirme: 1500,
  pionnier: 3000,
  ambassadeur: 5000,
};

export const GRADE_LABELS: Record<Grade, string> = {
  recrue: "Recrue",
  membre: "Membre",
  confirme: "Confirmé",
  pionnier: "Pionnier",
  ambassadeur: "Ambassadeur",
};

export const SECTEUR_LABELS: Record<SecteurCandidat, string> = {
  aeronautique: "Aéronautique",
  automobile: "Automobile",
  energie: "Énergie",
  robotique: "Robotique",
  industrie: "Industrie",
  bureau_etudes: "Bureau d'études",
};

export const DISPO_LABELS: Record<Disponibilite, string> = {
  immediate: "Immédiate",
  "1_mois": "Sous 1 mois",
  "3_mois": "Sous 3 mois",
  veille: "Veille",
};

export const XP_ACTIONS = {
  parrainage: 200,
  profil_complet: 100,
  message_tchat: 5,
  placement: 500,
  anciennete: 50,
} as const;

export const CHAT_CHANNELS = [
  "general",
  "annonces",
  "parrainage",
  "aeronautique",
  "automobile",
  "energie",
  "robotique",
  "industrie",
  "bureau-detudes",
  "offres-missions",
  "conseils-carriere",
] as const;

export const CHAT_CHANNEL_LABELS: Record<(typeof CHAT_CHANNELS)[number], string> = {
  general: "Général",
  annonces: "Annonces",
  parrainage: "Parrainage",
  aeronautique: "Aéronautique",
  automobile: "Automobile",
  energie: "Énergie",
  robotique: "Robotique",
  industrie: "Industrie",
  "bureau-detudes": "Bureau d'études",
  "offres-missions": "Offres & missions",
  "conseils-carriere": "Conseils carrière",
};
