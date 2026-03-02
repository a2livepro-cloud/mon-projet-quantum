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
import { CheckCircle, ArrowRight, Paperclip, X, ShieldCheck, Lock } from "lucide-react";
import type { SecteurCandidat, AnneesExperience, Disponibilite } from "@/types/database";
import { SECTEUR_LABELS, DISPO_LABELS } from "@/types/database";
import { Turnstile } from "@marsidev/react-turnstile";

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

const CODE_REGEX = /^QTM-[A-Z0-9]{6}$/i;

export default function InscriptionCandidatPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secteurs, setSecteurs] = useState<SecteurCandidat[]>([]);
  const [anneesExperience, setAnneesExperience] = useState<AnneesExperience | "">("");
  const [disponibilite, setDisponibilite] = useState<Disponibilite | "">("");
  const [referralCode, setReferralCode] = useState("");
  const [motivation, setMotivation] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const hasCode = CODE_REGEX.test(referralCode.trim());
  const isSpontanee = referralCode.trim().length > 0 && !hasCode
    ? false // still typing, not yet spontaneous
    : referralCode.trim().length === 0; // empty = spontaneous

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
    if (!captchaToken) {
      toast({ title: "CAPTCHA requis", description: "Veuillez compléter la vérification anti-bot.", variant: "destructive" });
      return;
    }
    // Validation code parrainage si renseigné
    if (referralCode.trim() && !hasCode) {
      toast({ title: "Code invalide", description: "Le format attendu est QTM-XXXXXX.", variant: "destructive" });
      return;
    }
    // Motivation obligatoire pour candidature spontanée
    if (isSpontanee && motivation.trim().length < 100) {
      toast({ title: "Motivation trop courte", description: "Décrivez votre profil en au moins 100 caractères.", variant: "destructive" });
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast({ title: "Mot de passe invalide", description: pwdError, variant: "destructive" });
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
      secteurs: secteurs,
      annees_experience: anneesExperience || null,
      disponibilite: disponibilite || null,
      referred_by: hasCode ? referralCode.trim().toUpperCase() : null,
      motivation: isSpontanee ? motivation.trim() : null,
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

    // Upload CV si fourni
    if (cvFile) {
      const ext = cvFile.name.split(".").pop() ?? "pdf";
      const cvPath = `${authData.user.id}/cv.${ext}`;
      const { error: storageError } = await supabase.storage
        .from("cvs")
        .upload(cvPath, cvFile, { upsert: true });
      if (storageError) {
        toast({ title: "CV non uploadé", description: "Votre inscription est enregistrée mais le CV n'a pas pu être joint. Contactez-nous.", variant: "destructive" });
      } else {
        await supabase.from("candidats").update({ cv_url: cvPath }).eq("id", authData.user.id);
      }
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
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${hasCode ? "bg-quantum-gold/10" : "bg-green-500/10"}`}>
              <CheckCircle className={`h-8 w-8 ${hasCode ? "text-quantum-gold" : "text-green-400"}`} />
            </div>
            {hasCode ? (
              <>
                <h2 className="font-syne text-2xl font-bold text-quantum-gold">Accès prioritaire !</h2>
                <p className="mt-3 text-slate-400">
                  Votre code parrainage a bien été enregistré.<br />
                  Votre profil sera examiné en priorité par l&apos;équipe QUANTUM.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-syne text-2xl font-bold text-white">Candidature reçue</h2>
                <p className="mt-3 text-slate-400">
                  Votre candidature spontanée est en cours d&apos;examen.<br />
                  Si votre profil correspond à nos critères, vous serez contacté.
                </p>
              </>
            )}
            <p className="mt-2 text-sm text-slate-500">
              Confirmation envoyée à <span className="text-slate-300">{email}</span>.
            </p>
            <Link href="/choisir?mode=connexion" className="mt-8 block">
              <Button className={`w-full gap-2 ${hasCode ? "bg-quantum-gold text-black hover:bg-quantum-gold/90" : ""}`}>
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

            {/* ── Code parrainage en premier ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="referral">Code parrainage</Label>
                {hasCode && (
                  <span className="flex items-center gap-1 rounded-full bg-quantum-gold/10 px-2 py-0.5 text-[10px] font-semibold text-quantum-gold">
                    <ShieldCheck className="h-3 w-3" />
                    Accès VIP
                  </span>
                )}
              </div>
              <Input
                id="referral"
                placeholder="QTM-XXXXXX"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className={
                  hasCode
                    ? "border-quantum-gold/50 bg-quantum-gold/5 text-quantum-gold placeholder:text-quantum-gold/30 focus-visible:ring-quantum-gold/30"
                    : ""
                }
              />
              {referralCode.trim().length > 0 && !hasCode && (
                <p className="text-xs text-amber-400">Format attendu : QTM-XXXXXX</p>
              )}
              {!referralCode.trim() && (
                <p className="text-xs text-slate-500">
                  Un code reçu de l&apos;équipe ou d&apos;un parrain vous donne accès prioritaire.
                </p>
              )}
            </div>

            {/* ── Avertissement candidature spontanée ── */}
            {isSpontanee && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Candidature sans invitation</p>
                    <p className="mt-0.5 text-xs text-amber-400/80">
                      Sans code parrainage, les candidatures sont examinées au cas par cas.
                      Décrivez ce qui vous rend unique pour augmenter vos chances.
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="motivation" className="text-amber-300 text-xs">
                    Pourquoi rejoindre QUANTUM ? <span className="text-amber-500">*</span>
                  </Label>
                  <textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    rows={4}
                    placeholder="Présentez votre profil, vos compétences clés et ce qui vous distingue dans le domaine mécanique/industriel…"
                    className="w-full resize-none rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                  />
                  <div className="flex justify-between text-xs">
                    <span className={motivation.trim().length < 100 ? "text-amber-500" : "text-green-400"}>
                      {motivation.trim().length < 100
                        ? `Encore ${100 - motivation.trim().length} caractères minimum`
                        : "✓ Longueur suffisante"}
                    </span>
                    <span className="text-slate-500">{motivation.trim().length} car.</span>
                  </div>
                </div>
              </div>
            )}

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
              <Label>Secteurs d&apos;activité <span className="text-slate-500 font-normal">(plusieurs possibles)</span></Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                {SECTEURS.map((s) => (
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

            {/* CV Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="cv">CV</Label>
                <span className="rounded-full bg-quantum-accent/10 px-2 py-0.5 text-[10px] font-semibold text-quantum-accent">
                  Recommandé
                </span>
              </div>
              {cvFile ? (
                <div className="flex items-center gap-2 rounded-lg border border-quantum-accent/30 bg-quantum-accent/5 px-3 py-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-quantum-accent" />
                  <span className="flex-1 truncate text-sm text-slate-200">{cvFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="shrink-0 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="cv"
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/10 px-4 py-3 text-sm text-slate-400 transition-colors hover:border-quantum-accent/40 hover:text-slate-300"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  Joindre votre CV (PDF, DOC — max 5 Mo)
                  <input
                    id="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        toast({ title: "Fichier trop volumineux", description: "Le CV ne doit pas dépasser 5 Mo.", variant: "destructive" });
                        return;
                      }
                      setCvFile(file);
                    }}
                  />
                </label>
              )}
              <p className="text-xs text-slate-500">
                Un CV accélère le traitement de votre demande par l&apos;équipe QUANTUM.
              </p>
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
            <Button
              type="submit"
              className={`w-full ${hasCode ? "bg-quantum-gold text-black font-semibold hover:bg-quantum-gold/90" : ""}`}
              disabled={loading || !captchaToken}
            >
              {loading
                ? "Inscription…"
                : hasCode
                ? "S'inscrire avec accès prioritaire"
                : "S'inscrire"}
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
