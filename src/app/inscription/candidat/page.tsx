"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AuthNav } from "@/components/auth-nav";
import { validatePassword } from "@/lib/utils";
import { PasswordRules } from "@/components/password-rules";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { SecteurCandidat, AnneesExperience, Disponibilite } from "@/types/database";
import { SECTEUR_LABELS, DISPO_LABELS } from "@/types/database";

const SECTEURS: SecteurCandidat[] = [
  "aeronautique",
  "automobile",
  "energie",
  "robotique",
  "industrie",
  "bureau_etudes",
];
const ANNEES: AnneesExperience[] = ["0-2", "3-5", "6-10", "10+"];
const DISPOS: Disponibilite[] = ["immediate", "1_mois", "3_mois", "veille"];

export default function InscriptionCandidatPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secteur, setSecteur] = useState<SecteurCandidat | "">("");
  const [anneesExperience, setAnneesExperience] = useState<AnneesExperience | "">("");
  const [disponibilite, setDisponibilite] = useState<Disponibilite | "">("");
  const [referralCode, setReferralCode] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gdprConsent) {
      toast({
        title: "Consentement requis",
        description: "Vous devez accepter les conditions RGPD pour vous inscrire.",
        variant: "destructive",
      });
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast({ title: "Mot de passe invalide", description: pwdError, variant: "destructive" });
      return;
    }
    setLoading(true);
    const fullName = `${prenom} ${nom}`.trim();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "candidat" } },
    });
    if (authError) {
      setLoading(false);
      toast({
        title: "Erreur d'inscription",
        description: authError.message,
        variant: "destructive",
      });
      return;
    }
    if (!authData.user) {
      setLoading(false);
      return;
    }
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role: "candidat",
      status: "pending",
      full_name: fullName,
      email,
      gdpr_consent_at: new Date().toISOString(),
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
    const { error: candidatError } = await supabase.from("candidats").insert({
      id: authData.user.id,
      secteur: secteur || null,
      annees_experience: anneesExperience || null,
      disponibilite: disponibilite || null,
      referred_by: referralCode.trim() || null,
    });
    if (candidatError) {
      toast({
        title: "Erreur candidat",
        description: candidatError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    setLoading(false);
    await supabase.auth.signOut();
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <AuthNav />
        <Card className="w-full max-w-md mt-14 text-center">
          <CardContent className="py-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="font-syne text-2xl font-bold text-white">Inscription enregistrée !</h2>
            <p className="mt-3 text-slate-400">
              Votre compte est en attente de validation.<br />
              Vous recevrez un email dès qu&apos;un administrateur aura validé votre accès.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Confirmation envoyée à <span className="text-slate-300">{email}</span>.
            </p>
            <Link href="/choisir?mode=connexion" className="mt-8 block">
              <Button className="w-full gap-2">
                Aller à la connexion
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthNav />
      <Card className="w-full max-w-lg mt-14">
        <CardHeader>
          <CardTitle className="font-syne">Inscription candidat</CardTitle>
          <CardDescription>
            Rejoignez la communauté QUANTUM. Votre accès sera validé par un admin.
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
              <Label>Secteur</Label>
              <Select
                value={secteur}
                onValueChange={(v) => setSecteur(v as SecteurCandidat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SECTEUR_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Années d&apos;expérience</Label>
              <Select
                value={anneesExperience}
                onValueChange={(v) => setAnneesExperience(v as AnneesExperience)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {ANNEES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a} ans
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Disponibilité</Label>
              <Select
                value={disponibilite}
                onValueChange={(v) => setDisponibilite(v as Disponibilite)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {DISPOS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DISPO_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">Code parrainage (optionnel)</Label>
              <Input
                id="referral"
                placeholder="QTM-XXXXXX"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="gdpr"
                checked={gdprConsent}
                onCheckedChange={(c) => setGdprConsent(!!c)}
              />
              <Label htmlFor="gdpr" className="text-sm leading-relaxed">
                J&apos;accepte d&apos;intégrer la base Quantum et d&apos;être
                contacté pour des missions (consentement RGPD obligatoire).
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Inscription…" : "S'inscrire"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Déjà inscrit ?{" "}
            <Link href="/choisir?mode=connexion" className="text-quantum-accent hover:underline">
              Connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
