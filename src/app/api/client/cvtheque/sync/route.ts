import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// ─── BEETWEEN API helpers ─────────────────────────────────────────────────────
// BEETWEEN REST API — authentication via Authorization: Token {api_key}
// Endpoint: GET {api_url}/api/v1/cvs/?format=json
// Each candidate has: id, first_name, last_name, skills[], location, experience, sector, availability
//
// NOTE : Si les endpoints changent, adaptez uniquement cette section.

type BeetweenCandidat = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  skills?: string[];           // compétences / logiciels
  tags?: string[];             // tags libres (fallback compétences)
  location?: string;           // ville
  experience?: string | number; // années d'expérience
  sector?: string;             // secteur d'activité
  availability?: string;       // disponibilité
  [key: string]: unknown;
};

async function fetchBeetweenCandidats(
  apiUrl: string,
  apiKey: string
): Promise<BeetweenCandidat[]> {
  const base = apiUrl.replace(/\/$/, "");

  // Tentative sur /api/v1/cvs/ (format standard BEETWEEN)
  const endpoints = [
    `${base}/api/v1/cvs/?format=json`,
    `${base}/api/v1/candidates/?format=json`,
    `${base}/v1/cvs`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Token ${apiKey}`,
          Accept: "application/json",
        },
        // 15 sec timeout
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      // BEETWEEN renvoie souvent { results: [...] } ou un tableau directement
      const candidates: BeetweenCandidat[] = Array.isArray(json)
        ? json
        : Array.isArray(json.results)
        ? json.results
        : [];
      if (candidates.length > 0) return candidates;
    } catch {
      // essai suivant
    }
  }
  return [];
}

function normalizeCandidat(
  raw: BeetweenCandidat,
  cvthequeId: string,
  clientId: string,
  index: number
): {
  cvtheque_id: string;
  client_id: string;
  external_id: string;
  quantum_id: string;
  competences: string[];
  secteur: string | null;
  annees_experience: string | null;
  localisation: string | null;
  disponibilite: string | null;
  source_label: string;
} {
  const externalId = String(raw.id ?? index);
  const suffix = externalId.slice(-6).toUpperCase().padStart(6, "0");
  const quantum_id = `QTM-EXT-${suffix}`;

  // Compétences : skills ou tags
  const competences: string[] = [
    ...(raw.skills ?? []),
    ...(raw.tags ?? []),
  ]
    .map((s) => String(s).trim())
    .filter(Boolean);

  // Années d'expérience : on normalise vers nos buckets
  let annees_experience: string | null = null;
  const expRaw = raw.experience;
  if (expRaw !== undefined && expRaw !== null) {
    const n = typeof expRaw === "number" ? expRaw : parseInt(String(expRaw));
    if (!isNaN(n)) {
      if (n <= 2) annees_experience = "0-2";
      else if (n <= 5) annees_experience = "3-5";
      else if (n <= 10) annees_experience = "6-10";
      else annees_experience = "10+";
    }
  }

  return {
    cvtheque_id: cvthequeId,
    client_id: clientId,
    external_id: externalId,
    quantum_id,
    competences,
    secteur: raw.sector ? String(raw.sector) : null,
    annees_experience,
    localisation: raw.location ? String(raw.location) : null,
    disponibilite: raw.availability ? String(raw.availability) : null,
    source_label: "BEETWEEN",
  };
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST() {
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

  // Récupérer la config BEETWEEN du client
  const { data: cvtheque, error: cvErr } = await supabase
    .from("cvtheques")
    .select("id, api_url, api_key")
    .eq("client_id", user.id)
    .eq("source", "beetween")
    .single();

  if (cvErr || !cvtheque)
    return NextResponse.json({ error: "Aucune CVthèque configurée" }, { status: 404 });

  // Appel BEETWEEN
  let rawCandidats: BeetweenCandidat[] = [];
  try {
    rawCandidats = await fetchBeetweenCandidats(cvtheque.api_url, cvtheque.api_key);
  } catch {
    const admin = createAdminClient();
    await admin
      .from("cvtheques")
      .update({ statut: "error", erreur_msg: "Impossible de joindre l'API BEETWEEN" })
      .eq("id", cvtheque.id);
    return NextResponse.json(
      { error: "Impossible de joindre l'API BEETWEEN. Vérifiez l'URL et la clé API." },
      { status: 502 }
    );
  }

  if (rawCandidats.length === 0) {
    const admin = createAdminClient();
    await admin
      .from("cvtheques")
      .update({ statut: "error", erreur_msg: "API jointe mais aucun candidat retourné" })
      .eq("id", cvtheque.id);
    return NextResponse.json(
      { error: "API jointe mais aucun CV trouvé. Vérifiez l'endpoint BEETWEEN." },
      { status: 422 }
    );
  }

  // Normaliser + insérer
  const normalized = rawCandidats.map((raw, i) =>
    normalizeCandidat(raw, cvtheque.id, user.id, i)
  );

  const admin = createAdminClient();

  // Upsert par (cvtheque_id, external_id)
  const { error: insertErr } = await admin
    .from("candidats_externes")
    .upsert(normalized, { onConflict: "cvtheque_id,external_id" });

  if (insertErr) {
    await admin
      .from("cvtheques")
      .update({ statut: "error", erreur_msg: insertErr.message })
      .eq("id", cvtheque.id);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Mettre à jour le statut de la CVthèque
  await admin
    .from("cvtheques")
    .update({
      statut: "active",
      derniere_sync: new Date().toISOString(),
      nb_candidats: normalized.length,
      erreur_msg: null,
    })
    .eq("id", cvtheque.id);

  return NextResponse.json({ ok: true, nb_candidats: normalized.length });
}
