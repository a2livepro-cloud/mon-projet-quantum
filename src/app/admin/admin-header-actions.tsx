"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";

export function AdminHeaderActions() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/connexion");
  }

  return (
    <div className="flex items-center gap-1 border-l border-white/10 pl-3 ml-1">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
          <Home className="h-4 w-4" />
          Accueil
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="gap-2 text-slate-400 hover:text-red-400"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </Button>
    </div>
  );
}
