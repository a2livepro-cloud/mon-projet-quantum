"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { ClientSidebar } from "./client-sidebar";

export function ClientLayoutClient({
  fullName,
  grade,
  children,
}: {
  fullName: string | null;
  grade: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen space-client">
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

      <ClientSidebar
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
