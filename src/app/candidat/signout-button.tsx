"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/connexion");
      }}
      className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Se déconnecter
    </button>
  );
}
