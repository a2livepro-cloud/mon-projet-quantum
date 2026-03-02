import type { Grade } from "@/types/database";

// Quotas mensuels de matching CVthèque par grade (-1 = illimité)
export const CVTHEQUE_QUOTA: Record<Grade, number> = {
  recrue:      0,
  membre:      5,
  confirme:    15,
  pionnier:    30,
  ambassadeur: -1,
};

export const CVTHEQUE_MIN_GRADE: Grade = "membre";

export type CvthequeMatchResult = {
  candidat_externe_id: string;
  quantum_id: string;
  score: number;
  matched_competences: string[];
  competences: string[];
  secteur: string | null;
  annees_experience: string | null;
  localisation: string | null;
  disponibilite: string | null;
};

export type CvthequeMatchError = {
  error: string;
  grade_required?: Grade;
  grade_current?: Grade;
  quota_used?: number;
  quota_max?: number;
};
