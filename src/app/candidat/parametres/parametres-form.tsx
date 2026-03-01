"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DISPO_LABELS } from "@/types/database";
import type { Disponibilite } from "@/types/database";
import { Mail, Lock, Clock } from "lucide-react";

const DISPOS: Disponibilite[] = ["immediate", "1_mois", "3_mois", "veille"];

export function ParametresForm({
  candidatId,
  disponibilite: initialDispo,
}: {
  candidatId: string;
  disponibilite: Disponibilite | null;
}) {
  // Disponibilité
  const [disponibilite, setDisponibilite] = useState<Disponibilite | "">(
    initialDispo ?? ""
  );
  const [loadingDispo, setLoadingDispo] = useState(false);

  // Email
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Password
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const { toast } = useToast();
  const supabase = createClient();

  async function handleDispoChange(val: Disponibilite) {
    setDisponibilite(val);
    setLoadingDispo(true);
    const { error } = await supabase
      .from("candidats")
      .update({ disponibilite: val })
      .eq("id", candidatId);
    setLoadingDispo(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Disponibilité mise à jour" });
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoadingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setLoadingEmail(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Demande envoyée",
        description: "Vérifiez votre nouvelle adresse email pour confirmer le changement.",
      });
      setEmail("");
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    if (password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Minimum 8 caractères.",
        variant: "destructive",
      });
      return;
    }
    if (password !== passwordConfirm) {
      toast({
        title: "Mots de passe différents",
        description: "Les deux mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoadingPassword(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mot de passe modifié" });
      setPassword("");
      setPasswordConfirm("");
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* Disponibilité */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Clock className="h-4 w-4 text-quantum-cyan" />
          <h2 className="font-syne font-semibold text-white">Disponibilité</h2>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Je suis disponible</Label>
          <Select
            value={disponibilite}
            onValueChange={(v) => handleDispoChange(v as Disponibilite)}
            disabled={loadingDispo}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {DISPOS.map((d) => (
                <SelectItem key={d} value={d}>
                  {DISPO_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-600">
            Cette information est visible par les recruteurs et dans les matchings.
          </p>
        </div>
      </section>

      {/* Email */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Mail className="h-4 w-4 text-quantum-accent" />
          <h2 className="font-syne font-semibold text-white">Adresse email</h2>
        </div>
        <form onSubmit={handleEmailChange} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-slate-300">
              Nouvel email
            </Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nouveau@email.com"
              autoComplete="email"
            />
          </div>
          <p className="text-xs text-slate-600">
            Un lien de confirmation sera envoyé à la nouvelle adresse.
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={loadingEmail || !email.trim()}
          >
            {loadingEmail ? "Envoi…" : "Mettre à jour l'email"}
          </Button>
        </form>
      </section>

      {/* Password */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Lock className="h-4 w-4 text-quantum-accent" />
          <h2 className="font-syne font-semibold text-white">Mot de passe</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-slate-300">
              Nouveau mot de passe
            </Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-slate-300">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <p className="text-xs text-slate-600">Minimum 8 caractères.</p>
          <Button
            type="submit"
            size="sm"
            disabled={loadingPassword || !password}
          >
            {loadingPassword ? "Enregistrement…" : "Changer le mot de passe"}
          </Button>
        </form>
      </section>
    </div>
  );
}
