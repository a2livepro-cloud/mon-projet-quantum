"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AuthNav } from "@/components/auth-nav";
import { ArrowRight, Lock } from "lucide-react";

export function ConnexionForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast({ title: "Information", description: decodeURIComponent(message) });
    }
  }, [searchParams, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .single();
    if (!profile) {
      toast({
        title: "Profil introuvable",
        description: "Votre inscription est incomplète. Veuillez vous réinscrire ou contacter l'administrateur.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      return;
    }
    if (profile?.status === "pending") {
      toast({
        title: "Compte en attente",
        description:
          "Votre compte doit être validé par un administrateur. Vous serez notifié par email.",
      });
      await supabase.auth.signOut();
      return;
    }
    if (profile?.status === "rejected") {
      toast({
        title: "Compte refusé",
        description: "Votre inscription a été refusée.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      return;
    }
    const role = profile?.role;
    if (role === "admin") router.push("/admin");
    else if (role === "candidat") router.push("/candidat/profil");
    else if (role === "client") router.push("/client/dashboard");
    else router.push("/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-quantum-bg px-4">
      <AuthNav />

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-quantum-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <p className="font-syne text-xs font-bold uppercase tracking-widest text-quantum-accent">
            QUANTUM
          </p>
          <h1 className="mt-2 font-syne text-3xl font-bold text-white">
            Connexion
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Accédez à votre espace QUANTUM
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-quantum-surface p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2 text-base"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connexion…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-white/5 pt-5 text-center text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link
              href="/choisir?mode=inscription"
              className="font-medium text-quantum-accent hover:underline"
            >
              Créer un compte
            </Link>
          </div>
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-xs text-slate-600">
          <Link href="/choisir?mode=connexion" className="hover:text-slate-400 transition-colors">
            ← Changer de profil
          </Link>
        </p>
      </div>
    </div>
  );
}
