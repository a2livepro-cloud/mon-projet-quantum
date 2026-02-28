"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FileText,
  MessageCircle,
  Trophy,
  Users,
  Settings,
  LogOut,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/fiches", label: "Mes fiches", icon: FileText },
  { href: "/client/communaute", label: "Communauté", icon: MessageCircle },
  { href: "/client/grades", label: "Grades", icon: Trophy },
  { href: "/client/parrainage", label: "Parrainage", icon: Users },
  { href: "/client/parametres", label: "Paramètres", icon: Settings },
];

const GRADE_COLORS: Record<string, string> = {
  recrue: "text-slate-400 bg-slate-400/10",
  membre: "text-blue-400 bg-blue-400/10",
  confirme: "text-cyan-400 bg-cyan-400/10",
  pionnier: "text-amber-400 bg-amber-400/10",
  ambassadeur: "text-yellow-400 bg-yellow-400/10",
};

export function ClientSidebar({
  fullName,
  grade,
}: {
  fullName: string | null;
  grade: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/connexion");
  }

  const gradeColor = GRADE_COLORS[grade] ?? GRADE_COLORS.recrue;
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-white/[0.06] bg-quantum-surface">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/[0.06] px-6">
        <Link
          href="/client/dashboard"
          className="font-syne text-lg font-bold tracking-tight text-white hover:text-quantum-accent transition-colors"
        >
          QUANTUM
        </Link>
      </div>

      {/* User info */}
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-quantum-accent/20 text-xs font-bold text-quantum-accent">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {fullName ?? "Client"}
            </p>
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize mt-0.5",
                gradeColor
              )}
            >
              {grade}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/client/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-quantum-accent/10 text-quantum-accent"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-quantum-accent" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-quantum-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-3 py-3 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 transition-all duration-150"
        >
          <Home className="h-4 w-4 shrink-0" />
          Accueil
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-red-500/[0.08] hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
