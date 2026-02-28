import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ficheId: string }> }
) {
  const { ficheId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: fiche } = await supabase
    .from("fiches_poste")
    .select("id, client_id, embedding")
    .eq("id", ficheId)
    .single();

  if (!fiche || fiche.client_id !== user.id) {
    return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
  }

  if (!fiche.embedding || !Array.isArray(fiche.embedding)) {
    const { data: candidats } = await supabase
      .from("candidats")
      .select("id, secteur, annees_experience, disponibilite, competences, xp, grade")
      .not("embedding", "is", null)
      .limit(50);
    return NextResponse.json(
      (candidats ?? []).map((c, i) => ({
        candidat_id: c.id,
        quantum_id: `QTM-${String(i + 1).padStart(4, "0")}`,
        secteur: c.secteur,
        annees_experience: c.annees_experience,
        disponibilite: c.disponibilite,
        competences: c.competences ?? [],
        score: 0,
        grade: c.grade,
      }))
    );
  }

  const { data: matches } = await supabase.rpc("match_candidats_to_fiche", {
    fiche_embedding: fiche.embedding,
    match_count: 30,
  });

  if (!matches || !Array.isArray(matches)) {
    const { data: allCandidats } = await supabase
      .from("candidats")
      .select("id, secteur, annees_experience, disponibilite, competences, xp, grade")
      .not("embedding", "is", null)
      .limit(30);
    const list = (allCandidats ?? []).map((c, i) => ({
      candidat_id: c.id,
      quantum_id: `QTM-${String(i + 1).padStart(4, "0")}`,
      secteur: c.secteur,
      annees_experience: c.annees_experience,
      disponibilite: c.disponibilite,
      competences: c.competences ?? [],
      score: 0,
      grade: c.grade,
    }));
    return NextResponse.json(list);
  }

  const candidatIds = matches.map((m: { candidat_id: string }) => m.candidat_id);
  const { data: candidats } = await supabase
    .from("candidats")
    .select("id, secteur, annees_experience, disponibilite, competences, xp, grade")
    .in("id", candidatIds);

  const byId = new Map((candidats ?? []).map((c) => [c.id, c]));
  const results = matches.map((m: { candidat_id: string; score: number }, i: number) => {
    const c = byId.get(m.candidat_id);
    return {
      candidat_id: m.candidat_id,
      quantum_id: `QTM-${String(i + 1).padStart(4, "0")}`,
      secteur: c?.secteur ?? null,
      annees_experience: c?.annees_experience ?? null,
      disponibilite: c?.disponibilite ?? null,
      competences: c?.competences ?? [],
      score: m.score,
      grade: c?.grade ?? "recrue",
    };
  });

  return NextResponse.json(results);
}
