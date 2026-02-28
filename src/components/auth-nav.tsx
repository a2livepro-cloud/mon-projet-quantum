"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthNav() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 border-b border-white/10 bg-quantum-bg/80 backdrop-blur">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>
      <Link
        href="/"
        className="font-syne font-bold text-white tracking-tight hover:text-quantum-accent transition-colors"
      >
        QUANTUM
      </Link>
      <div className="w-20" />
    </header>
  );
}
