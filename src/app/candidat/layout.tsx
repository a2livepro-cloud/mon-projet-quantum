import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, MessageCircle, Award } from "lucide-react";

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
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidat") redirect("/");
  if (profile?.status !== "approved") {
    redirect(
      "/connexion?message=" + encodeURIComponent("Votre compte est en attente de validation.")
    );
  }

  return (
    <div className="min-h-screen bg-quantum-bg">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-quantum-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/candidat/profil" className="font-syne font-bold text-white">
            QUANTUM
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/candidat/profil">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" /> Profil
              </Button>
            </Link>
            <Link href="/candidat/communaute">
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" /> Communauté
              </Button>
            </Link>
            <Link href="/candidat/grades">
              <Button variant="ghost" size="sm" className="gap-2">
                <Award className="h-4 w-4" /> Grades
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
