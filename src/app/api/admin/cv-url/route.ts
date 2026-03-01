import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Vérifier que l'appelant est admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "admin")
    return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { candidatId } = await request.json() as { candidatId: string };
  if (!candidatId)
    return NextResponse.json({ error: "candidatId requis" }, { status: 400 });

  const admin = createAdminClient();

  // Récupérer le cv_path
  const { data: candidat } = await admin
    .from("candidats")
    .select("cv_path")
    .eq("id", candidatId)
    .single();

  if (!candidat?.cv_path)
    return NextResponse.json({ error: "Aucun CV pour ce candidat" }, { status: 404 });

  // Générer une URL signée valable 1 heure
  const { data: signed, error } = await admin.storage
    .from("cvs")
    .createSignedUrl(candidat.cv_path, 3600);

  if (error || !signed)
    return NextResponse.json({ error: "Impossible de générer l'URL" }, { status: 500 });

  return NextResponse.json({ url: signed.signedUrl });
}
