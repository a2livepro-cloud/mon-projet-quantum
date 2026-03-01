import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. Vérifier que l'appelant est un admin (via la session normale)
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

  // 2. Lire le body
  const body = await request.json();
  const { profileId, newStatus, adminNote } = body as {
    profileId: string;
    newStatus: "approved" | "rejected";
    adminNote?: string;
  };
  if (!profileId || !newStatus)
    return NextResponse.json({ error: "profileId et newStatus requis" }, { status: 400 });

  // 3. Utiliser le client admin (service_role) pour bypasser les RLS
  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      status: newStatus,
      ...(adminNote ? { admin_note: adminNote } : {}),
    })
    .eq("id", profileId);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 4. Post-validation : code parrainage + XP parrain
  if (newStatus === "approved") {
    const { data: p } = await admin
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .single();

    if (p?.role === "candidat") {
      const { data: code } = await admin.rpc("generate_referral_code");
      await admin.from("candidats").update({ referral_code: code }).eq("id", profileId);

      const { data: cand } = await admin
        .from("candidats")
        .select("referred_by")
        .eq("id", profileId)
        .single();

      if (cand?.referred_by) {
        const { data: referrerCand } = await admin
          .from("candidats")
          .select("id")
          .eq("referral_code", cand.referred_by)
          .single();
        const { data: referrerClient } = await admin
          .from("clients")
          .select("id")
          .eq("referral_code", cand.referred_by)
          .single();
        const referrerId = referrerCand?.id ?? referrerClient?.id;

        if (referrerId) {
          await admin.from("referrals").insert({
            referrer_id: referrerId,
            referred_id: profileId,
            status: "validated",
            xp_awarded: true,
          });
          const { data: refProfile } = await admin
            .from("profiles")
            .select("role")
            .eq("id", referrerId)
            .single();
          const table = refProfile?.role === "candidat" ? "candidats" : "clients";
          const { data: refRow } = await admin
            .from(table)
            .select("xp, grade")
            .eq("id", referrerId)
            .single();
          const newXp = (refRow?.xp ?? 0) + 200;
          const newGrade =
            newXp >= 5000 ? "ambassadeur"
            : newXp >= 3000 ? "pionnier"
            : newXp >= 1500 ? "confirme"
            : newXp >= 500  ? "membre"
            : "recrue";
          await admin.from("xp_logs").insert({ user_id: referrerId, action: "parrainage", points: 200 });
          await admin.from(table).update({ xp: newXp, grade: newGrade }).eq("id", referrerId);
        }
      }
    }

    if (p?.role === "client") {
      const { data: code } = await admin.rpc("generate_referral_code");
      await admin.from("clients").update({ referral_code: code }).eq("id", profileId);
    }
  }

  return NextResponse.json({ ok: true });
}
