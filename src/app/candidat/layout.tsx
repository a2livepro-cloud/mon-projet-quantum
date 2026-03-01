import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CandidatLayoutClient } from "./candidat-layout-client";
import { SignOutButton } from "./signout-button";
import { Clock, XCircle } from "lucide-react";

export default async function CandidatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, full_name, admin_note")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidat") redirect("/");

  /* ── Compte rejeté ── */
  if (profile?.status === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center space-candidat dot-grid px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-syne text-2xl font-bold text-white">
              Demande non retenue
            </h1>
            <p className="text-slate-400">
              Bonjour{" "}
              {profile.full_name?.split(" ")[0]
                ? `${profile.full_name.split(" ")[0]},`
                : ""}{" "}
              votre dossier n&apos;a pas été retenu à ce stade.
            </p>
          </div>

          {profile.admin_note && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                Raison communiquée par l&apos;équipe :
              </p>
              <p className="text-sm text-slate-300">{profile.admin_note}</p>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Des questions ?{" "}
            <span className="text-quantum-accent">contact@quantumcabinet.fr</span>
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  /* ── Compte en attente ── */
  if (profile?.status !== "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center space-candidat dot-grid px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-quantum-gold/10 ring-1 ring-quantum-gold/20">
              <Clock className="h-8 w-8 animate-pulse text-quantum-gold" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-syne text-2xl font-bold text-white">
              Profil en cours de validation
            </h1>
            <p className="text-slate-400">
              Bonjour{" "}
              {profile.full_name?.split(" ")[0]
                ? `${profile.full_name.split(" ")[0]},`
                : ""}{" "}
              votre dossier a bien été reçu et est en cours de vérification par notre équipe.
            </p>
          </div>

          <div className="rounded-xl border border-quantum-gold/20 bg-quantum-gold/5 p-4">
            <p className="text-sm text-quantum-gold">
              Vous recevrez un email dès que votre profil sera validé.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-600">
              Une question urgente ?{" "}
              <span className="text-quantum-accent">contact@quantumcabinet.fr</span>
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    );
  }

  /* ── Compte approuvé ── */
  const { data: candidatData } = await supabase
    .from("candidats")
    .select("grade")
    .eq("id", user.id)
    .single();

  const cookieStore = await cookies();
  const welcomed = cookieStore.get(`quantum_welcomed_${user.id}`)?.value === "1";

  return (
    <CandidatLayoutClient
      fullName={profile.full_name}
      grade={candidatData?.grade ?? "recrue"}
      showWelcome={!welcomed}
      userId={user.id}
    >
      {children}
    </CandidatLayoutClient>
  );
}
