import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientLayoutClient } from "./client-layout-client";

export default async function ClientLayout({
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

  if (profile?.role !== "client") redirect("/");
  if (profile?.status !== "approved") {
    redirect(
      "/connexion?message=" +
        encodeURIComponent("Votre compte est en attente de validation par notre équipe.")
    );
  }

  const { data: clientData } = await supabase
    .from("clients")
    .select("grade")
    .eq("id", user.id)
    .single();

  return (
    <ClientLayoutClient
      fullName={profile.full_name}
      grade={clientData?.grade ?? "recrue"}
    >
      {children}
    </ClientLayoutClient>
  );
}
