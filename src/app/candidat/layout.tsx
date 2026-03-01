import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CandidatSidebar } from "./candidat-sidebar";

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
    .select("role, status, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidat") redirect("/");
  if (profile?.status !== "approved") {
    redirect(
      "/connexion?message=" + encodeURIComponent("Votre compte est en attente de validation.")
    );
  }

  const { data: candidatData } = await supabase
    .from("candidats")
    .select("grade")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-quantum-bg">
      <CandidatSidebar
        fullName={profile.full_name}
        grade={candidatData?.grade ?? "recrue"}
      />
      <main className="ml-60 flex-1 p-6 max-w-[calc(100vw-240px)]">{children}</main>
    </div>
  );
}
