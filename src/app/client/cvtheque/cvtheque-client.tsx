"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  MapPin,
  Loader2,
  Trash2,
  Settings2,
  Lock,
} from "lucide-react";
import type { CvthequeMatchResult } from "@/lib/cvtheque";
import type { Grade } from "@/types/database";
import { GRADE_LABELS } from "@/types/database";

type Cvtheque = {
  id: string;
  nom: string | null;
  api_url: string | null;
  statut: string;
  derniere_sync: string | null;
  nb_candidats: number;
  erreur_msg: string | null;
};
type Fiche = { id: string; titre: string | null; secteur: string | null; competences_requises: string[] };

const STATUT_ICON: Record<string, React.ReactNode> = {
  active:   <CheckCircle2 className="h-4 w-4 text-green-400" />,
  error:    <XCircle className="h-4 w-4 text-red-400" />,
  inactive: <Clock className="h-4 w-4 text-slate-500" />,
};
const STATUT_LABEL: Record<string, string> = {
  active:   "Connectée",
  error:    "Erreur",
  inactive: "Non synchronisée",
};

const GRADE_COLORS: Record<Grade, string> = {
  recrue:      "text-slate-400 bg-slate-400/10 border-slate-400/20",
  membre:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  confirme:    "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  pionnier:    "text-amber-400 bg-amber-400/10 border-amber-400/20",
  ambassadeur: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

export function CvthequeClient({
  cvtheque: initialCvtheque,
  fiches,
  grade,
  quota,
  usedThisMonth,
  minGrade,
}: {
  cvtheque: Cvtheque | null;
  fiches: Fiche[];
  grade: Grade;
  quota: number;   // -1 = illimité, 0 = pas d'accès
  usedThisMonth: number;
  minGrade: Grade;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Config form
  const [showForm, setShowForm] = useState(!initialCvtheque);
  const [nom, setNom] = useState(initialCvtheque?.nom ?? "BEETWEEN");
  const [apiUrl, setApiUrl] = useState(initialCvtheque?.api_url ?? "https://api.beetween.fr");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [cvtheque, setCvtheque] = useState<Cvtheque | null>(initialCvtheque);

  // Matching
  const [selectedFiche, setSelectedFiche] = useState(fiches[0]?.id ?? "");
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<CvthequeMatchResult[] | null>(null);
  const [matched, setMatched] = useState(false);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/client/cvtheque/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, api_url: apiUrl, api_key: apiKey }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Erreur", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "CVthèque configurée", description: "Synchronisez maintenant pour importer vos CVs." });
    setShowForm(false);
    setApiKey("");
    router.refresh();
  }

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/client/cvtheque/sync", { method: "POST" });
    const json = await res.json();
    setSyncing(false);
    if (!res.ok) {
      toast({ title: "Erreur de synchronisation", description: json.error, variant: "destructive" });
      setCvtheque((prev) => prev ? { ...prev, statut: "error", erreur_msg: json.error } : prev);
      return;
    }
    toast({
      title: `${json.nb_candidats} CVs importés`,
      description: "Lancez maintenant le matching sur une de vos fiches.",
    });
    setCvtheque((prev) =>
      prev
        ? { ...prev, statut: "active", nb_candidats: json.nb_candidats, derniere_sync: new Date().toISOString(), erreur_msg: null }
        : prev
    );
    router.refresh();
  }

  async function handleMatch() {
    if (!selectedFiche) return;
    setMatching(true);
    setResults(null);
    const res = await fetch("/api/client/cvtheque/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ficheId: selectedFiche }),
    });
    const json = await res.json();
    setMatching(false);
    if (!res.ok) {
      toast({ title: "Erreur", description: json.error, variant: "destructive" });
      return;
    }
    setResults(Array.isArray(json) ? json : []);
    setMatched(true);
  }

  async function handleDelete() {
    if (!confirm("Supprimer la connexion et tous les CVs importés ?")) return;
    const res = await fetch("/api/client/cvtheque/connect", { method: "DELETE" });
    if (res.ok) {
      toast({ title: "CVthèque supprimée" });
      setCvtheque(null);
      setResults(null);
      setShowForm(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Config card ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>Connexion BEETWEEN</span>
              {cvtheque && !showForm && (
                <span className="flex items-center gap-1 text-sm font-normal">
                  {STATUT_ICON[cvtheque.statut] ?? STATUT_ICON.inactive}
                  <span className={cvtheque.statut === "active" ? "text-green-400" : cvtheque.statut === "error" ? "text-red-400" : "text-slate-500"}>
                    {STATUT_LABEL[cvtheque.statut] ?? cvtheque.statut}
                  </span>
                </span>
              )}
            </CardTitle>
            {cvtheque && !showForm && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-slate-400 hover:text-slate-200"
                  onClick={() => setShowForm(true)}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Reconfigurer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <form onSubmit={saveConfig} className="space-y-4">
              <div className="rounded-lg border border-quantum-accent/20 bg-quantum-accent/5 p-3 text-sm text-slate-400">
                <p className="font-medium text-slate-300">Comment obtenir votre clé API BEETWEEN ?</p>
                <ol className="mt-1.5 list-decimal list-inside space-y-0.5">
                  <li>Connectez-vous à votre espace BEETWEEN</li>
                  <li>Allez dans <span className="font-mono text-xs text-slate-300">Paramètres → API</span></li>
                  <li>Générez ou copiez votre token d&apos;accès</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom de la connexion</Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="BEETWEEN – Cabinet X"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="api_url">URL de votre instance</Label>
                  <Input
                    id="api_url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.beetween.fr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="api_key">Clé API (token)</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Votre token BEETWEEN…"
                  required
                />
                <p className="text-xs text-slate-600">Votre clé n&apos;est jamais affichée après enregistrement.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
                {cvtheque && (
                  <Button type="button" variant="ghost" className="text-slate-400" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          ) : cvtheque ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{cvtheque.nom ?? "BEETWEEN"}</p>
                <p className="text-xs text-slate-500">
                  {cvtheque.nb_candidats > 0
                    ? `${cvtheque.nb_candidats} CV${cvtheque.nb_candidats > 1 ? "s" : ""} importé${cvtheque.nb_candidats > 1 ? "s" : ""}`
                    : "Aucun CV importé"}
                  {cvtheque.derniere_sync && (
                    <> · Dernière sync {new Date(cvtheque.derniere_sync).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                  )}
                </p>
                {cvtheque.erreur_msg && (
                  <p className="text-xs text-red-400">{cvtheque.erreur_msg}</p>
                )}
              </div>
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
              >
                {syncing
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                {syncing ? "Synchronisation…" : "Synchroniser"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Matching card ───────────────────────────────────────── */}
      {cvtheque && cvtheque.nb_candidats > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-quantum-gold" />
                Retrouver les profils oubliés
              </CardTitle>
              {/* Quota badge */}
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${GRADE_COLORS[grade]}`}>
                  {GRADE_LABELS[grade]}
                </span>
                {quota === 0 ? (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <Lock className="h-3 w-3" /> Accès verrouillé
                  </span>
                ) : quota === -1 ? (
                  <span className="text-xs text-slate-400">Requêtes illimitées</span>
                ) : (
                  <span className={`text-xs font-medium ${usedThisMonth >= quota ? "text-red-400" : "text-slate-400"}`}>
                    {usedThisMonth}/{quota} requêtes ce mois
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grade insuffisant */}
            {quota === 0 ? (
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-5 text-center space-y-2">
                <Lock className="h-8 w-8 text-amber-400/60 mx-auto" />
                <p className="font-medium text-amber-300">Fonctionnalité réservée aux membres actifs</p>
                <p className="text-sm text-slate-400">
                  Le matching CVthèque est disponible à partir du rang{" "}
                  <span className="font-semibold text-blue-400">{GRADE_LABELS[minGrade]}</span>.
                  Gagnez de l&apos;XP en utilisant la plateforme pour débloquer cette fonctionnalité.
                </p>
                <a href="/client/grades" className="inline-block mt-1 text-sm text-quantum-accent hover:underline">
                  Voir les grades et avantages →
                </a>
              </div>
            ) : quota !== -1 && usedThisMonth >= quota ? (
              <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-5 text-center space-y-2">
                <p className="font-medium text-red-300">Quota mensuel atteint</p>
                <p className="text-sm text-slate-400">
                  Vous avez utilisé {usedThisMonth}/{quota} requêtes ce mois.
                  Renouvellement automatique le 1er du mois prochain.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Montez au rang{" "}
                  {grade === "membre" ? "Confirmé (15/mois)" :
                   grade === "confirme" ? "Pionnier (30/mois)" :
                   "Ambassadeur (illimité)"}
                  {" "}pour plus de requêtes.
                </p>
              </div>
            ) : (
              <>
            <p className="text-sm text-slate-400">
              Sélectionnez une fiche de poste — QUANTUM analyse vos {cvtheque.nb_candidats} CVs BEETWEEN et remonte les meilleurs matchs.
            </p>

            {fiches.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-slate-400">
                Aucune fiche active.{" "}
                <a href="/client/fiches/nouvelle" className="text-quantum-accent hover:underline">
                  Créer une fiche →
                </a>
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label>Fiche de poste</Label>
                  <Select value={selectedFiche} onValueChange={setSelectedFiche}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une fiche…" />
                    </SelectTrigger>
                    <SelectContent>
                      {fiches.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.titre ?? "Fiche sans titre"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleMatch} disabled={matching || !selectedFiche} className="gap-2">
                  {matching
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Zap className="h-4 w-4" />}
                  {matching ? "Analyse…" : "Lancer le matching"}
                </Button>
              </div>
            )}

            {/* Résultats */}
            {matched && results !== null && (
              <div className="space-y-3 pt-2 border-t border-white/[0.06] mt-2 pt-4">
                <p className="text-sm text-slate-500">
                  {results.length} profil{results.length !== 1 ? "s" : ""} retrouvé{results.length !== 1 ? "s" : ""} dans votre CVthèque
                </p>

                {results.length === 0 && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center">
                    <p className="text-slate-400">Aucun profil ne correspond à cette fiche.</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Vérifiez que les compétences de la fiche sont bien renseignées.
                    </p>
                  </div>
                )}

                {results.map((r) => (
                  <Card key={r.candidat_externe_id} className="border-white/[0.08] hover:border-white/20 transition-colors">
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2 flex-1">
                        {/* ID + source */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-quantum-accent">
                            {r.quantum_id}
                          </span>
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
                            BEETWEEN
                          </span>
                        </div>

                        {/* Infos */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-400">
                          {r.secteur && <span>{r.secteur}</span>}
                          {r.annees_experience && <span>{r.annees_experience} ans d&apos;exp.</span>}
                          {r.disponibilite && <span className="text-green-400">{r.disponibilite}</span>}
                        </div>
                        {r.localisation && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {r.localisation}
                          </div>
                        )}

                        {/* Compétences matchées */}
                        {r.matched_competences.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {r.matched_competences.map((c) => (
                              <span
                                key={c}
                                className="rounded-md bg-quantum-accent/10 px-2 py-0.5 text-xs text-quantum-accent"
                              >
                                {c} ✓
                              </span>
                            ))}
                            {r.competences
                              .filter((c) => !r.matched_competences.includes(c))
                              .slice(0, 4)
                              .map((c) => (
                                <span
                                  key={c}
                                  className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-slate-400"
                                >
                                  {c}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="shrink-0 w-24 text-right space-y-1">
                        <p className="text-2xl font-bold text-quantum-gold">
                          {Math.round(r.score * 100)}%
                        </p>
                        <Progress value={r.score * 100} className="h-1.5" />
                        <p className="text-[10px] text-slate-600">de correspondance</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Pas encore de CVthèque ─────────────────────────────── */}
      {!cvtheque && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Aucune CVthèque connectée.</p>
            <Button className="mt-4 gap-2" onClick={() => setShowForm(true)}>
              Connecter BEETWEEN
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
