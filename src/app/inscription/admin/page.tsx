"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AuthNav } from "@/components/auth-nav";
import { validatePassword } from "@/lib/utils";
import { PasswordRules } from "@/components/password-rules";
import { ShieldCheck } from "lucide-react";

export default function InscriptionAdminPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. Valider le mot de passe
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast({ title: "Mot de passe invalide", description: pwdError, variant: "destructive" });
      return;
    }

    setLoading(true);

    // 2. Vérifier le code secret côté serveur
    const verifyRes = await fetch("/api/auth/verify-admin-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: secretCode }),
    });

    if (!verifyRes.ok) {
      const { error } = await verifyRes.json();
      toast({ title: "Accès refusé", description: error, variant: "destructive" });
      setLoading(false);
      return;
    }

    // 2. Créer le compte Auth
    const fullName = `${prenom} ${nom}`.trim();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "admin" } },
    });

    if (authError || !authData.user) {
      toast({
        title: "Erreur d'inscription",
        description: authError?.message ?? "Erreur inconnue",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // 3. Créer le profil admin directement approuvé
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role: "admin",
      status: "approved",
      full_name: fullName,
      email,
    });

    if (profileError) {
      toast({
        title: "Erreur profil",
        description: profileError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Compte admin créé",
      description: "Bienvenue sur QUANTUM Admin.",
    });
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthNav />
      <Card className="w-full max-w-md mt-14">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-quantum-accent" />
            <CardTitle className="font-syne">Espace administrateur</CardTitle>
          </div>
          <CardDescription>
            Accès restreint. Un code secret est requis pour créer un compte admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwdFocused(true)}
                onBlur={() => setPwdFocused(false)}
                required
              />
              <PasswordRules password={password} visible={pwdFocused} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code secret admin</Label>
              <Input
                id="code"
                type="password"
                placeholder="••••••••"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création…" : "Créer le compte admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
