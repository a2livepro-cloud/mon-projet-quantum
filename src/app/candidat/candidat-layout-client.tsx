"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { CandidatSidebar } from "./candidat-sidebar";
import { useToast } from "@/components/ui/use-toast";

export function CandidatLayoutClient({
  fullName,
  grade,
  showWelcome,
  userId,
  children,
}: {
  fullName: string | null;
  grade: string;
  showWelcome: boolean;
  userId: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!showWelcome) return;

    const firstName = fullName?.split(" ")[0] ?? "";
    toast({
      title: `Bienvenue${firstName ? `, ${firstName}` : ""} !`,
      description:
        "Votre profil a été validé. Explorez vos canaux, complétez votre fiche et commencez à gagner des XP.",
      duration: 7000,
    });

    // Prevent the toast from showing again on this device
    document.cookie = `quantum_welcomed_${userId}=1; max-age=31536000; path=/; SameSite=Lax`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen space-candidat">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 flex items-center justify-center rounded-lg border border-white/10 bg-quantum-surface/80 p-2 text-slate-300 backdrop-blur lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <CandidatSidebar
        fullName={fullName}
        grade={grade}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="dot-grid ml-0 flex-1 p-6 pt-16 max-w-full lg:ml-60 lg:max-w-[calc(100vw-240px)] lg:pt-6">
        {children}
      </main>
    </div>
  );
}
