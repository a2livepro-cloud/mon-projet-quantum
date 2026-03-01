"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "communaute_last_seen";

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
  isOpen = true,
  onClose,
}: {
  fullName: string | null;
  grade: string;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [communauteUnread, setCommunauteUnread] = useState(false);

  const isCommunautePage = pathname.startsWith("/client/communaute");

  useEffect(() => {
    if (isCommunautePage) {
      localStorage.setItem(LS_KEY, new Date().toISOString());
      setCommunauteUnread(false);
      return;
    }

    async function check() {
      const lastSeen = localStorage.getItem(LS_KEY);
      let q = supabase.from("messages").select("*", { count: "exact", head: true });
      if (lastSeen) q = q.gt("created_at", lastSeen);
      const { count } = await q;
      setCommunauteUnread((count ?? 0) > 0);
    }
    check();

    const sub = supabase
      .channel("notif-communaute-client")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        setCommunauteUnread(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommunautePage]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/connexion");
  }

  const gradeColor = GRADE_COLORS[grade] ?? GRADE_COLORS.recrue;
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-white/[0.06] bg-quantum-surface transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-quantum-accent/60 to-transparent" />
      {/* Logo + close button (mobile) */}
      <div className="flex h-16 items-center border-b border-white/[0.06] px-6">
        <Link
          href="/client/dashboard"
          className="font-syne text-lg font-bold tracking-tight text-white hover:text-quantum-accent transition-colors"
        >
          QUANTUM
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto flex items-center justify-center rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
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
          const isCommunaute = item.href.includes("communaute");
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
              <span className="relative shrink-0">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-quantum-accent" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                {isCommunaute && communauteUnread && !active && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-1 ring-quantum-surface" />
                )}
              </span>
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
