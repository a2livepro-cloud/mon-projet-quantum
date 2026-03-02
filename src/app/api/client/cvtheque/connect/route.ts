import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const body = await request.json();
  const { nom, api_url, api_key } = body as {
    nom?: string;
    api_url?: string;
    api_key: string;
  };

  if (!api_key?.trim())
    return NextResponse.json({ error: "Clé API requise" }, { status: 400 });

  const { data, error } = await supabase
    .from("cvtheques")
    .upsert(
      {
        client_id: user.id,
        source: "beetween",
        nom: nom?.trim() || "BEETWEEN",
        api_url: api_url?.trim() || "https://api.beetween.fr",
        api_key: api_key.trim(),
        statut: "inactive",
        erreur_msg: null,
      },
      { onConflict: "client_id,source" }
    )
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { error } = await supabase
    .from("cvtheques")
    .delete()
    .eq("client_id", user.id)
    .eq("source", "beetween");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
