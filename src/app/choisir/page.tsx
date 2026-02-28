"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const ROLES = [
  {
    key: "candidat",
    emoji: "👤",
    label: "Candidat",
    description: "Accédez à votre profil, gérez vos disponibilités et découvrez les opportunités matchées.",
    connexionHref: "/connexion",
    inscriptionHref: "/inscription/candidat",
    accent: "border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5",
    dot: "bg-blue-500",
    btnClass: "bg-blue-600 hover:bg-blue-500 text-white",
    tag: "text-blue-400",
  },
  {
    key: "client",
    emoji: "🏢",
    label: "Client / Entreprise",
    description: "Accédez au dashboard de matching et de recrutement. Déposez vos fiches de poste.",
    connexionHref: "/connexion",
    inscriptionHref: "/inscription/client",
    accent: "border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5",
    dot: "bg-emerald-500",
    btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white",
    tag: "text-emerald-400",
  },
  {
    key: "admin",
    emoji: "👑",
    label: "Administrateur",
    description: "Accès réservé à l'équipe QUANTUM pour la gestion de la plateforme.",
    connexionHref: "/connexion",
    inscriptionHref: "/inscription/admin",
    accent: "border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5",
    dot: "bg-amber-500",
    btnClass: "bg-amber-600 hover:bg-amber-500 text-white",
    tag: "text-amber-400",
  },
];

function ChoisirContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "inscription" ? "inscription" : "connexion";

  const isInscription = mode === "inscription";
  const visibleRoles = isInscription ? ROLES.filter((r) => r.key !== "admin") : ROLES;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-quantum-bg px-4 py-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[600px] w-[600px] rounded-full bg-quantum-accent/4 blur-[120px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative w-full max-w-3xl">
        {/* Back */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="font-syne text-xs font-bold uppercase tracking-widest text-quantum-accent">
            QUANTUM
          </p>
          <h1 className="mt-3 font-syne text-4xl font-bold text-white md:text-5xl">
            {isInscription ? "Créer un compte" : "Se connecter"}
          </h1>
          <p className="mt-3 text-slate-400">
            {isInscription
              ? "Choisissez votre type de compte pour commencer."
              : "Sélectionnez votre profil pour accéder à votre espace."}
          </p>
        </div>

        {/* Cards */}
        <div
          className={cn(
            "grid gap-4",
            isInscription
              ? "md:grid-cols-2 max-w-2xl mx-auto"
              : "md:grid-cols-3"
          )}
        >
          {visibleRoles.map((role) => {
            const href = isInscription ? role.inscriptionHref : role.connexionHref;
            return (
              <div
                key={role.key}
                className={cn(
                  "group flex flex-col rounded-2xl border bg-quantum-surface p-6 transition-all duration-200 hover:-translate-y-0.5",
                  role.accent
                )}
              >
                {/* Icon */}
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl transition-transform duration-200 group-hover:scale-110">
                  {role.emoji}
                </div>

                {/* Label */}
                <div className="mb-1 flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", role.dot)} />
                  <p className={cn("text-xs font-bold uppercase tracking-widest", role.tag)}>
                    {role.key}
                  </p>
                </div>

                <h2 className="font-syne text-lg font-bold text-white">{role.label}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {role.description}
                </p>

                <Link href={href} className="mt-6">
                  <Button className={cn("w-full gap-2 font-semibold", role.btnClass)}>
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Toggle mode */}
        <p className="mt-8 text-center text-sm text-slate-500">
          {isInscription ? (
            <>
              Déjà inscrit ?{" "}
              <Link
                href="/choisir?mode=connexion"
                className="font-medium text-quantum-accent hover:underline"
              >
                Se connecter
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link
                href="/choisir?mode=inscription"
                className="font-medium text-quantum-accent hover:underline"
              >
                Créer un compte
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function ChoisirPage() {
  return (
    <Suspense>
      <ChoisirContent />
    </Suspense>
  );
}
