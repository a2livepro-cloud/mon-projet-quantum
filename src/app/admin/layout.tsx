import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Building,
  Handshake,
  Briefcase,
} from "lucide-react";
import { AdminHeaderActions } from "./admin-header-actions";
import { AdminCommunauteLink } from "@/components/chat/admin-communaute-link";

export default async function AdminLayout({
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen space-admin">
      <header className="sticky top-0 z-40 bg-[#080B12]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="font-syne font-bold text-white">
            QUANTUM Admin
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Link href="/admin/candidats">
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="h-4 w-4" /> Candidats
              </Button>
            </Link>
            <Link href="/admin/clients">
              <Button variant="ghost" size="sm" className="gap-2">
                <Building className="h-4 w-4" /> Clients
              </Button>
            </Link>
            <Link href="/admin/matchings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Handshake className="h-4 w-4" /> Matchings
              </Button>
            </Link>
            <Link href="/admin/placements">
              <Button variant="ghost" size="sm" className="gap-2">
                <Briefcase className="h-4 w-4" /> Placements
              </Button>
            </Link>
            <AdminCommunauteLink />
            <AdminHeaderActions />
          </nav>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      </header>
      <main className="dot-grid mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
