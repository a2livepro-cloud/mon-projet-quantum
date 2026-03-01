"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { AuthNav } from "@/components/auth-nav";
import { validatePassword } from "@/lib/utils";
import { PasswordRules } from "@/components/password-rules";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { SECTEUR_LABELS } from "@/types/database";
import type { SecteurCandidat } from "@/types/database";

const ALL_SECTEURS: SecteurCandidat[] = [
  "aeronautique",
  "automobile",
  "energie",
  "robotique",
  "industrie",
  "bureau_etudes",
];
const TAILLES = ["1-10", "11-50", "51-200", "200+"];

export default function InscriptionClientPage() {
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [secteurs, setSecteurs] = useState<SecteurCandidat[]>([]);
  const [tailleEntreprise, setTailleEntreprise] = useState("");
  const [nomContact, setNomContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [descriptionBesoin, setDescriptionBesoin] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [cguAccepted, setCguAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast({ title: "Mot de passe invalide", description: pwdError, variant: "destructive" });
      return;
    }
    if (!cguAccepted) {
      toast({ title: "CGU requises", description: "Veuillez accepter les conditions générales d'utilisation.", variant: "destructive" });
      return;
    }
    if (!captchaToken) {
      toast({ title: "CAPTCHA requis", description: "Veuillez compléter la vérification anti-bot.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Vérification CAPTCHA côté serveur
    const captchaRes = await fetch("/api/verify-captcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: captchaToken }),
    });
    if (!captchaRes.ok) {
      toast({ title: "CAPTCHA invalide", description: "La vérification anti-bot a échoué. Réessayez.", variant: "destructive" });
      setLoading(false);
      return;
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nomContact, role: "client" } },
    });
    if (authError) {
      setLoading(false);
      toast({ title: "Erreur d'inscription", description: authError.message, variant: "destructive" });
      return;
    }
    if (!authData.user) { setLoading(false); return; }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role: "client",
      status: "pending",
      full_name: nomContact,
      email,
    });
    if (profileError) {
      toast({ title: "Erreur profil", description: profileError.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const { error: clientError } = await supabase.from("clients").insert({
      id: authData.user.id,
      nom_entreprise: nomEntreprise,
      secteurs: secteurs,
      taille_entreprise: tailleEntreprise || null,
      referred_by: referralCode.trim() || null,
      description_besoin: descriptionBesoin.trim() || null,
    });
    if (clientError) {
      toast({ title: "Erreur client", description: clientError.message, variant: "destructive" });
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
            <h2 className="font-syne text-2xl font-bold text-white">Demande envoyée !</h2>
            <p className="mt-3 text-slate-400">
              Votre demande d&apos;accès est en cours d&apos;examen.<br />
              Vous serez contacté sous <span className="text-white font-medium">48h</span> par l&apos;équipe QUANTUM.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Un email de confirmation a été envoyé à <span className="text-slate-300">{email}</span>.
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
          <CardTitle className="font-syne">Inscription client</CardTitle>
          <CardDescription>
            Déposez des fiches de poste et accédez au matching. Validation admin requise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entreprise">Nom de l&apos;entreprise</Label>
              <Input
                id="entreprise"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Secteurs d&apos;activité{" "}
                <span className="font-normal text-slate-500">(un ou plusieurs)</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                {ALL_SECTEURS.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={secteurs.includes(s)}
                      onCheckedChange={(checked) =>
                        setSecteurs(checked ? [...secteurs, s] : secteurs.filter((x) => x !== s))
                      }
                    />
                    <span className="text-sm text-slate-300">{SECTEUR_LABELS[s]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Taille de l&apos;entreprise</Label>
              <Select value={tailleEntreprise} onValueChange={setTailleEntreprise}>
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {TAILLES.map((t) => <SelectItem key={t} value={t}>{t} salariés</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Nom du contact</Label>
              <Input id="contact" value={nomContact} onChange={(e) => setNomContact(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
              <Label htmlFor="besoin">Description du besoin (optionnel)</Label>
              <Textarea
                id="besoin"
                placeholder="Types de profils recherchés..."
                value={descriptionBesoin}
                onChange={(e) => setDescriptionBesoin(e.target.value)}
                rows={3}
              />
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
              <input
                id="cgu"
                type="checkbox"
                checked={cguAccepted}
                onChange={(e) => setCguAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer accent-quantum-accent"
              />
              <label htmlFor="cgu" className="text-sm text-slate-400 cursor-pointer">
                J&apos;accepte les{" "}
                <Link href="/cgu" className="text-quantum-accent hover:underline" target="_blank">
                  conditions générales d&apos;utilisation
                </Link>
              </label>
            </div>
            <div className="flex justify-center">
              {captchaToken ? (
                <div className="flex w-full items-center gap-3 rounded border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-400">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="flex-1 text-left">Vérification réussie</span>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-slate-500">Cloudflare</div>
                    <div className="text-[10px] text-slate-600">Turnstile</div>
                  </div>
                </div>
              ) : !showCaptcha ? (
                <button
                  type="button"
                  onClick={() => setShowCaptcha(true)}
                  className="flex w-full items-center gap-3 rounded border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:border-white/20 hover:bg-white/[0.08] transition-colors"
                >
                  <div className="h-5 w-5 rounded border border-white/20 bg-[#0E1420] shrink-0" />
                  <span className="flex-1 text-left">Je ne suis pas un robot</span>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-slate-500">Cloudflare</div>
                    <div className="text-[10px] text-slate-600">Turnstile</div>
                  </div>
                </button>
              ) : (
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={setCaptchaToken}
                  onExpire={() => { setCaptchaToken(null); setShowCaptcha(false); }}
                  options={{ theme: "dark", language: "fr" }}
                />
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !captchaToken}>
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
