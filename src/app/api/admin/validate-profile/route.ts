import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const { profileId, newStatus, motif } = body as {
    profileId: string;
    newStatus: "approved" | "rejected";
    motif?: string;
  };
  if (!profileId || !newStatus) {
    return NextResponse.json(
      { error: "profileId et newStatus requis" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      status: newStatus,
      ...(motif && { rejection_motif: motif }),
    })
    .eq("id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (newStatus === "approved") {
    const { data: p } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .single();
    if (p?.role === "candidat") {
      const { data: code } = await supabase.rpc("generate_referral_code");
      await supabase
        .from("candidats")
        .update({ referral_code: code })
        .eq("id", profileId);
      const { data: cand } = await supabase
        .from("candidats")
        .select("referred_by")
        .eq("id", profileId)
        .single();
      if (cand?.referred_by) {
        const { data: referrerCandidat } = await supabase
          .from("candidats")
          .select("id")
          .eq("referral_code", cand.referred_by)
          .single();
        const referrerId = referrerCandidat?.id ?? (await supabase.from("clients").select("id").eq("referral_code", cand.referred_by).single()).data?.id;
        if (referrerId) {
          await supabase.from("referrals").insert({
            referrer_id: referrerId,
            referred_id: profileId,
            status: "validated",
            xp_awarded: true,
          });
          const { data: refProfile } = await supabase.from("profiles").select("role").eq("id", referrerId).single();
          const table = refProfile?.role === "candidat" ? "candidats" : "clients";
          const { data: refRow } = await supabase.from(table).select("xp, grade").eq("id", referrerId).single();
          const newXp = (refRow?.xp ?? 0) + 200;
          const newGrade = newXp >= 5000 ? "ambassadeur" : newXp >= 3000 ? "pionnier" : newXp >= 1500 ? "confirme" : newXp >= 500 ? "membre" : "recrue";
          await supabase.from("xp_logs").insert({ user_id: referrerId, action: "parrainage", points: 200 });
          await supabase.from(table).update({ xp: newXp, grade: newGrade }).eq("id", referrerId);
        }
      }
    }
    if (p?.role === "client") {
      const { data: code } = await supabase.rpc("generate_referral_code");
      await supabase
        .from("clients")
        .update({ referral_code: code })
        .eq("id", profileId);
    }
  }

  return NextResponse.json({ ok: true });
}
