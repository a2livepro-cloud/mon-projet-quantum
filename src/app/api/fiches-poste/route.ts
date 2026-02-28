import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const {
    titre,
    description,
    secteur,
    competences_requises,
    localisation,
    type_contrat,
  } = body;

  const textForEmbedding = [titre, description, secteur, (competences_requises ?? []).join(" ")]
    .filter(Boolean)
    .join(" ");

  let embedding: number[] | null = null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && textForEmbedding) {
    try {
      const openai = new OpenAI({ apiKey });
      const { data } = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textForEmbedding.slice(0, 8000),
      });
      embedding = data[0]?.embedding ?? null;
    } catch (e) {
      console.error("OpenAI embedding error", e);
    }
  }

  const { data: fiche, error } = await supabase
    .from("fiches_poste")
    .insert({
      client_id: user.id,
      titre: titre || null,
      description: description || null,
      secteur: secteur || null,
      competences_requises: competences_requises ?? [],
      localisation: localisation || null,
      type_contrat: type_contrat || null,
      statut: "active",
      embedding,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: fiche.id });
}
