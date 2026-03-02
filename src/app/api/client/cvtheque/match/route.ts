import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { Grade } from "@/types/database";
import {
  CVTHEQUE_QUOTA,
  CVTHEQUE_MIN_GRADE,
  type CvthequeMatchResult,
  type CvthequeMatchError,
} from "@/lib/cvtheque";

// ─── Score ────────────────────────────────────────────────────────────────────

function scoreCandidat(
  candidatComps: string[],
  requiredComps: string[],
  candidatSecteur: string | null,
  ficheSecteur: string | null
): { score: number; matched: string[] } {
  const normalize = (s: string) => s.toLowerCase().trim();
  const reqNorm = requiredComps.map(normalize);
  const candNorm = candidatComps.map(normalize);

  let matched: string[] = [];
  if (reqNorm.length > 0) {
    matched = requiredComps.filter((r) => {
      const rn = normalize(r);
      return candNorm.some((c) => c.includes(rn) || rn.includes(c));
    });
  }
  const compScore = reqNorm.length > 0 ? matched.length / reqNorm.length : 0.5;

  let secteurScore = 0.5;
  if (candidatSecteur && ficheSecteur) {
    secteurScore =
      normalize(candidatSecteur).includes(normalize(ficheSecteur)) ||
      normalize(ficheSecteur).includes(normalize(candidatSecteur))
        ? 1
        : 0;
  }

  return {
    score: Math.min(1, compScore * 0.75 + secteurScore * 0.25),
    matched,
  };
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "client" || profile?.status !== "approved")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // ── Vérifier le grade du client ────────────────────────────────────────────
  const { data: clientData } = await supabase
    .from("clients")
    .select("grade")
    .eq("id", user.id)
    .single();

  const grade = (clientData?.grade ?? "recrue") as Grade;
  const quota = CVTHEQUE_QUOTA[grade];

  if (quota === 0) {
    return NextResponse.json(
      {
        error: `La CVthèque nécessite le rang Membre minimum. Votre rang actuel : ${grade}.`,
        grade_required: CVTHEQUE_MIN_GRADE,
        grade_current: grade,
      } satisfies CvthequeMatchError,
      { status: 403 }
    );
  }

  // ── Vérifier le quota mensuel ─────────────────────────────────────────────
  if (quota !== -1) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const admin = createAdminClient();
    const { count } = await admin
      .from("cvtheque_match_logs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    const used = count ?? 0;
    if (used >= quota) {
      return NextResponse.json(
        {
          error: `Quota mensuel atteint (${used}/${quota} requêtes). Renouvellement le 1er du mois.`,
          quota_used: used,
          quota_max: quota,
          grade_current: grade,
        } satisfies CvthequeMatchError,
        { status: 429 }
      );
    }
  }

  // ── Matching ───────────────────────────────────────────────────────────────
  const { ficheId } = (await request.json()) as { ficheId?: string };
  if (!ficheId)
    return NextResponse.json({ error: "ficheId requis" }, { status: 400 });

  const { data: fiche } = await supabase
    .from("fiches_poste")
    .select("id, secteur, competences_requises")
    .eq("id", ficheId)
    .eq("client_id", user.id)
    .single();

  if (!fiche)
    return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });

  const { data: candidats } = await supabase
    .from("candidats_externes")
    .select("id, quantum_id, competences, secteur, annees_experience, localisation, disponibilite")
    .eq("client_id", user.id);

  if (!candidats || candidats.length === 0)
    return NextResponse.json([], { status: 200 });

  const results: CvthequeMatchResult[] = candidats
    .map((c) => {
      const { score, matched } = scoreCandidat(
        c.competences ?? [],
        fiche.competences_requises ?? [],
        c.secteur,
        fiche.secteur
      );
      return {
        candidat_externe_id: c.id,
        quantum_id: c.quantum_id,
        score,
        matched_competences: matched,
        competences: c.competences ?? [],
        secteur: c.secteur,
        annees_experience: c.annees_experience,
        localisation: c.localisation,
        disponibilite: c.disponibilite,
      };
    })
    .filter((r) => r.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  const admin = createAdminClient();

  // Log la requête (pour le quota)
  await admin.from("cvtheque_match_logs").insert({
    client_id: user.id,
    fiche_id: ficheId,
  });

  // Persister les matchings
  if (results.length > 0) {
    await admin.from("matchings_externes").upsert(
      results.map((r) => ({
        fiche_id: ficheId,
        candidat_externe_id: r.candidat_externe_id,
        score: r.score,
        matched_competences: r.matched_competences,
      })),
      { onConflict: "fiche_id,candidat_externe_id" }
    );
  }

  return NextResponse.json(results);
}
