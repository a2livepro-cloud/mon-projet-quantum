import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const { ficheId, candidatId } = body as { ficheId: string; candidatId: string };
  if (!ficheId || !candidatId) {
    return NextResponse.json(
      { error: "ficheId et candidatId requis" },
      { status: 400 }
    );
  }

  const { data: fiche } = await supabase
    .from("fiches_poste")
    .select("client_id")
    .eq("id", ficheId)
    .single();
  if (!fiche || fiche.client_id !== user.id) {
    return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("matchings")
    .update({ statut: "interested" })
    .eq("fiche_id", ficheId)
    .eq("candidat_id", candidatId);

  if (updateError) {
    const { error: insertError } = await supabase.from("matchings").insert({
      fiche_id: ficheId,
      candidat_id: candidatId,
      score: 0,
      source: "sourcing_allan",
      statut: "interested",
    });
    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
