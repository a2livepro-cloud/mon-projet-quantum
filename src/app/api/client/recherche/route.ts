import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RechercheFilters = {
  competences?: string;      // free text, comma-separated
  secteur?: string;
  annees_experience?: string;
  disponibilite?: string;
  localisation?: string;
  mobilite?: string;
};

export type RechercheResult = {
  quantum_id: string;
  secteur: string | null;
  annees_experience: string | null;
  disponibilite: string | null;
  localisation: string | null;
  mobilite: string | null;
  competences: string[];
  grade: string;
  // internal — used by the interested action
  _id: string;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Verify the caller is an approved client
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "client" || profile?.status !== "approved") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body: RechercheFilters = await req.json();
  const admin = createAdminClient();

  // Build query via admin client (bypasses RLS, so we can join profiles)
  let query = admin
    .from("candidats")
    .select(
      "id, secteur, annees_experience, disponibilite, localisation, mobilite, competences, grade, referral_code"
    )
    .limit(60);

  // Filter: secteur
  if (body.secteur) {
    query = query.eq("secteur", body.secteur);
  }

  // Filter: années d'expérience
  if (body.annees_experience) {
    query = query.eq("annees_experience", body.annees_experience);
  }

  // Filter: disponibilité
  if (body.disponibilite) {
    query = query.eq("disponibilite", body.disponibilite);
  }

  // Filter: mobilité
  if (body.mobilite) {
    query = query.eq("mobilite", body.mobilite);
  }

  // Filter: localisation (case-insensitive partial match)
  if (body.localisation?.trim()) {
    query = query.ilike("localisation", `%${body.localisation.trim()}%`);
  }

  const { data: candidats, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter: competences (client-side after DB fetch, for flexible matching)
  const searchTerms = body.competences
    ? body.competences
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  let results = candidats ?? [];

  if (searchTerms.length > 0) {
    results = results.filter((c) => {
      const comps = (c.competences ?? []).map((s: string) => s.toLowerCase());
      return searchTerms.some((term) =>
        comps.some((comp: string) => comp.includes(term))
      );
    });
  }

  // Cross-check with profiles to ensure candidats are approved
  if (results.length > 0) {
    const ids = results.map((c) => c.id);
    const { data: approvedProfiles } = await admin
      .from("profiles")
      .select("id")
      .in("id", ids)
      .eq("status", "approved")
      .eq("role", "candidat");

    const approvedIds = new Set((approvedProfiles ?? []).map((p) => p.id));
    results = results.filter((c) => approvedIds.has(c.id));
  }

  // Anonymize results
  const anonymized: RechercheResult[] = results.map((c) => ({
    quantum_id: c.referral_code ?? `QTM-${c.id.slice(0, 6).toUpperCase()}`,
    secteur: c.secteur,
    annees_experience: c.annees_experience,
    disponibilite: c.disponibilite,
    localisation: c.localisation,
    mobilite: c.mobilite,
    competences: c.competences ?? [],
    grade: c.grade,
    _id: c.id,
  }));

  return NextResponse.json(anonymized);
}
