import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, CheckCircle, Star } from "lucide-react";
import { NetworkBackground } from "@/components/network-background";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-quantum-bg text-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-quantum-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="font-syne text-xl font-bold tracking-tight text-white">
            QUANTUM
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/choisir?mode=connexion">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Connexion
              </Button>
            </Link>
            <Link href="/choisir?mode=inscription">
              <Button size="sm" className="gap-1.5">
                Commencer
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative flex min-h-screen items-center overflow-hidden px-4 pt-16">
          {/* Background effects */}
          <div className="pointer-events-none absolute inset-0">
            {/* Network animation */}
            <NetworkBackground />
            {/* Radial glows on top */}
            <div className="absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-quantum-accent/6 blur-[140px]" />
            <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-quantum-cyan/4 blur-[100px]" />
            {/* Vignette to fade content edges */}
            <div className="absolute inset-0 bg-gradient-to-b from-quantum-bg/60 via-transparent to-quantum-bg/80" />
          </div>

          <div className="relative mx-auto max-w-5xl py-32 text-center">
            {/* Tag */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-quantum-accent/30 bg-quantum-accent/5 px-4 py-1.5 text-sm text-quantum-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-quantum-accent animate-pulse" />
              Plateforme de recrutement ingénierie mécanique
            </div>

            <h1
              className="font-syne text-5xl font-bold leading-[1.1] tracking-normal text-white md:text-6xl lg:text-7xl"
              style={{ textShadow: "0 2px 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.5)" }}
            >
              Le réseau des{" "}
              <span className="bg-gradient-to-r from-quantum-accent via-quantum-cyan to-quantum-accent bg-clip-text text-transparent">
                ingénieurs
              </span>
              <br />
              qui recrutent différemment
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
              Matching par IA, communauté sectorielle, anonymat garanti.
              QUANTUM connecte les talents d&apos;excellence aux entreprises qui les méritent.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/choisir?mode=inscription">
                <Button size="lg" className="gap-2 px-8 text-base shadow-lg shadow-quantum-accent/20">
                  Créer un compte
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/choisir?mode=connexion">
                <Button size="lg" variant="outline" className="px-8 text-base border-white/10 hover:border-white/20">
                  Se connecter
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              {["Données hébergées EU", "Conformité RGPD", "Anonymat candidats", "Validation manuelle"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/5 bg-quantum-surface/50 px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: "IA", label: "Matching vectoriel", color: "text-quantum-accent" },
                { value: "100%", label: "CV anonymisés", color: "text-quantum-cyan" },
                { value: "3", label: "Secteurs actifs", color: "text-quantum-gold" },
                { value: "24h", label: "Délai validation", color: "text-green-400" },
              ].map(({ value, label, color }) => (
                <div key={label} className="text-center">
                  <p className={`font-syne text-3xl font-extrabold ${color}`}>{value}</p>
                  <p className="mt-1 text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-quantum-accent">Fonctionnalités</p>
              <h2 className="mt-2 font-syne text-3xl font-bold text-white md:text-4xl">
                Tout ce dont vous avez besoin
              </h2>
              <p className="mt-3 text-slate-400">
                Une plateforme pensée pour les professionnels de l&apos;ingénierie.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  color: "text-quantum-accent",
                  bg: "bg-quantum-accent/10",
                  title: "Matching par IA",
                  desc: "Algorithme vectoriel qui analyse compétences, secteur et expérience pour proposer les profils les plus pertinents. Pas de CV en clair côté client.",
                },
                {
                  icon: Users,
                  color: "text-quantum-cyan",
                  bg: "bg-quantum-cyan/10",
                  title: "Communauté sectorielle",
                  desc: "Tchat dédié par secteur — aéronautique, automobile, énergie, robotique. Échanges professionnels, offres, conseils carrière. Zéro spam.",
                },
                {
                  icon: Shield,
                  color: "text-quantum-gold",
                  bg: "bg-quantum-gold/10",
                  title: "Grades & Parrainage",
                  desc: "Système de XP : gagnez des points en complétant votre profil, en chattant, en parrainant. Débloquez des avantages exclusifs (Recrue → Ambassadeur).",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-white/5 bg-quantum-surface p-8 transition-all duration-300 hover:border-white/10 hover:bg-quantum-surface/80 hover:-translate-y-1"
                >
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <h3 className="font-syne text-lg font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 bg-quantum-surface/30 px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-quantum-accent">Process</p>
              <h2 className="mt-2 font-syne text-3xl font-bold text-white md:text-4xl">
                Comment ça fonctionne ?
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Candidat flow */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
                <p className="mb-6 text-sm font-bold uppercase tracking-widest text-blue-400">Pour les candidats</p>
                <ol className="space-y-5">
                  {[
                    "Créez votre profil (secteur, compétences, disponibilité)",
                    "Validation manuelle par notre équipe sous 24h",
                    "Apparaissez dans les matchings clients — anonymement",
                    "L'équipe QUANTUM gère la mise en relation",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-300">{step}</p>
                    </li>
                  ))}
                </ol>
                <Link href="/choisir?mode=inscription" className="mt-8 block">
                  <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-500">
                    Je suis candidat
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Client flow */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
                <p className="mb-6 text-sm font-bold uppercase tracking-widest text-emerald-400">Pour les entreprises</p>
                <ol className="space-y-5">
                  {[
                    "Créez votre compte entreprise (validation requise)",
                    "Déposez vos fiches de poste avec les compétences requises",
                    "Recevez automatiquement les profils matchés (anonymisés)",
                    "Cliquez sur « Je veux aller plus loin » — on s'occupe du reste",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-300">{step}</p>
                    </li>
                  ))}
                </ol>
                <Link href="/choisir?mode=inscription" className="mt-8 block">
                  <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500">
                    Je recrute
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Grades teaser */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-quantum-gold">Gamification</p>
            <h2 className="mt-2 font-syne text-3xl font-bold text-white md:text-4xl">
              Progressez dans la communauté
            </h2>
            <p className="mt-3 text-slate-400">
              Plus vous êtes actif, plus vous débloquez d&apos;avantages.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "Recrue", xp: "0 XP", color: "border-slate-600 text-slate-400" },
                { label: "Membre", xp: "500 XP", color: "border-blue-500/40 text-blue-400" },
                { label: "Confirmé", xp: "1 500 XP", color: "border-cyan-500/40 text-cyan-400" },
                { label: "Pionnier", xp: "3 000 XP", color: "border-amber-500/40 text-amber-400" },
                { label: "Ambassadeur", xp: "5 000 XP", color: "border-yellow-400/40 text-yellow-400" },
              ].map(({ label, xp, color }) => (
                <div
                  key={label}
                  className={`rounded-full border px-5 py-2 text-sm font-semibold ${color}`}
                >
                  {label}
                  <span className="ml-2 text-xs opacity-60">{xp}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-500">
              {[
                { icon: Star, text: "Profil complet → +100 XP" },
                { icon: Users, text: "Parrainage → +200 XP" },
                { icon: Zap, text: "Placement → +500 XP" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-quantum-gold" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-white/5 px-4 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-syne text-3xl font-bold text-white md:text-4xl">
              Prêt à rejoindre QUANTUM ?
            </h2>
            <p className="mt-4 text-slate-400">
              Candidats, entreprises — créez votre compte et commencez dès aujourd&apos;hui.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/choisir?mode=inscription">
                <Button size="lg" className="gap-2 px-8 shadow-lg shadow-quantum-accent/20">
                  Créer un compte gratuit
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/choisir?mode=connexion">
                <Button size="lg" variant="ghost" className="px-8 text-slate-300">
                  Déjà inscrit ? Connexion
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-4 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-slate-600 md:flex-row">
            <span className="font-syne font-bold text-slate-500">QUANTUM</span>
            <p>Conformité RGPD · Consentement enregistré · Données hébergées EU</p>
            <div className="flex gap-4">
              <Link href="/choisir?mode=connexion" className="hover:text-slate-400 transition-colors">Connexion</Link>
              <Link href="/choisir?mode=inscription" className="hover:text-slate-400 transition-colors">Inscription</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
