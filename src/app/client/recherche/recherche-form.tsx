"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  SECTEUR_LABELS,
  DISPO_LABELS,
  MOBILITE_LABELS,
  GRADE_LABELS,
} from "@/types/database";
import type { SecteurCandidat, AnneesExperience, Disponibilite, Mobilite, Grade } from "@/types/database";
import { Search, MapPin, Loader2, X, ChevronRight } from "lucide-react";
import type { RechercheResult } from "@/app/api/client/recherche/route";

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
const MOBILITES: Mobilite[] = ["locale", "regionale", "nationale", "internationale"];

type Fiche = { id: string; titre: string | null };

const GRADE_COLOR: Record<string, string> = {
  recrue:      "text-slate-400 bg-slate-400/10 border-slate-400/20",
  membre:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  confirme:    "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  pionnier:    "text-amber-400 bg-amber-400/10 border-amber-400/20",
  ambassadeur: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

export function RechercheForm({ fiches }: { fiches: Fiche[] }) {
  // Filters
  const [competences, setCompetences] = useState("");
  const [secteur, setSecteur] = useState("");
  const [anneesExperience, setAnneesExperience] = useState("");
  const [disponibilite, setDisponibilite] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [mobilite, setMobilite] = useState("");

  // Results + state
  const [results, setResults] = useState<RechercheResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Interest dialog
  const [interestTarget, setInterestTarget] = useState<RechercheResult | null>(null);
  const [selectedFicheId, setSelectedFicheId] = useState("");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  const hasFilters =
    competences || secteur || anneesExperience || disponibilite || localisation || mobilite;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/client/recherche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competences: competences || undefined,
          secteur: secteur || undefined,
          annees_experience: anneesExperience || undefined,
          disponibilite: disponibilite || undefined,
          localisation: localisation || undefined,
          mobilite: mobilite || undefined,
        }),
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive", description: "Impossible de lancer la recherche." });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setCompetences("");
    setSecteur("");
    setAnneesExperience("");
    setDisponibilite("");
    setLocalisation("");
    setMobilite("");
    setResults(null);
    setSearched(false);
  }

  async function handleSendInterest() {
    if (!interestTarget || !selectedFicheId) return;
    setSendingInterest(true);
    const res = await fetch("/api/client/interested", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ficheId: selectedFicheId, candidatId: interestTarget._id }),
    });
    setSendingInterest(false);
    if (res.ok) {
      setSentIds((prev) => new Set(prev).add(interestTarget._id));
      toast({
        title: "Demande envoyée",
        description: "L'équipe Quantum vous recontactera pour organiser la mise en relation.",
      });
      setInterestTarget(null);
      setSelectedFicheId("");
    } else {
      const json = await res.json();
      toast({ title: "Erreur", description: json.error ?? "Impossible d'envoyer.", variant: "destructive" });
    }
  }

  return (
    <>
      {/* Search form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Competences — full width */}
            <div className="space-y-1.5">
              <Label htmlFor="competences">Compétences / logiciels</Label>
              <Input
                id="competences"
                placeholder="CATIA, SolidWorks, FEA…"
                value={competences}
                onChange={(e) => setCompetences(e.target.value)}
              />
              <p className="text-xs text-slate-600">Séparez par des virgules pour rechercher plusieurs termes</p>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Secteur</Label>
                <Select value={secteur} onValueChange={setSecteur}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
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
              <div className="space-y-1.5">
                <Label>Expérience</Label>
                <Select value={anneesExperience} onValueChange={setAnneesExperience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
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
              <div className="space-y-1.5">
                <Label>Disponibilité</Label>
                <Select value={disponibilite} onValueChange={setDisponibilite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
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
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="localisation">Localisation</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="localisation"
                    className="pl-9"
                    placeholder="Toulouse, Paris, Lyon…"
                    value={localisation}
                    onChange={(e) => setLocalisation(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Mobilité</Label>
                <Select value={mobilite} onValueChange={setMobilite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOBILITES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MOBILITE_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Recherche…" : "Rechercher"}
              </Button>
              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                  Effacer les filtres
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            {results?.length ?? 0} profil{(results?.length ?? 0) !== 1 ? "s" : ""} trouvé
            {(results?.length ?? 0) !== 1 ? "s" : ""}
          </p>

          {results?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Aucun profil ne correspond à ces critères.</p>
                <p className="mt-1 text-sm text-slate-600">
                  Essayez d&apos;élargir votre recherche en retirant certains filtres.
                </p>
              </CardContent>
            </Card>
          )}

          {results?.map((r) => (
            <Card
              key={r._id}
              className="transition-colors hover:border-white/20"
            >
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 flex-1">
                  {/* Identity */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-quantum-accent">
                      {r.quantum_id}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        GRADE_COLOR[r.grade] ?? GRADE_COLOR.recrue
                      }`}
                    >
                      {(GRADE_LABELS as Record<string, string>)[r.grade] ?? r.grade}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-400">
                    {r.secteur && (
                      <span>{(SECTEUR_LABELS as Record<string, string>)[r.secteur]}</span>
                    )}
                    {r.annees_experience && (
                      <span>{r.annees_experience} ans d&apos;exp.</span>
                    )}
                    {r.disponibilite && (
                      <span className="text-green-400">
                        {(DISPO_LABELS as Record<string, string>)[r.disponibilite]}
                      </span>
                    )}
                  </div>

                  {/* Location + mobility */}
                  {(r.localisation || r.mobilite) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                      {r.localisation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {r.localisation}
                        </span>
                      )}
                      {r.mobilite && (
                        <span>
                          Mobilité {(MOBILITE_LABELS as Record<string, string>)[r.mobilite]?.toLowerCase()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Competences */}
                  {r.competences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {r.competences.slice(0, 8).map((c) => (
                        <span
                          key={c}
                          className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-slate-300"
                        >
                          {c}
                        </span>
                      ))}
                      {r.competences.length > 8 && (
                        <span className="text-xs text-slate-600">
                          +{r.competences.length - 8}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="shrink-0">
                  {sentIds.has(r._id) ? (
                    <span className="text-sm font-medium text-green-400">
                      Demande envoyée ✓
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        setInterestTarget(r);
                        setSelectedFicheId(fiches[0]?.id ?? "");
                      }}
                    >
                      Je veux aller plus loin
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Interest dialog */}
      <Dialog
        open={!!interestTarget}
        onOpenChange={(open) => {
          if (!open) {
            setInterestTarget(null);
            setSelectedFicheId("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aller plus loin avec ce profil</DialogTitle>
            <DialogDescription>
              Associez cet intérêt à l&apos;une de vos fiches de poste. L&apos;équipe Quantum
              organisera la mise en relation.
            </DialogDescription>
          </DialogHeader>

          {fiches.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-sm text-slate-400">
                Vous n&apos;avez pas encore de fiche de poste active.
              </p>
              <a
                href="/client/fiches/nouvelle"
                className="mt-2 inline-block text-sm text-quantum-accent hover:underline"
              >
                Créer une fiche →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-slate-300">Fiche de poste concernée</Label>
              <Select value={selectedFicheId} onValueChange={setSelectedFicheId}>
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
              <p className="text-xs text-slate-600">
                Profil anonyme{" "}
                <span className="font-mono text-quantum-accent">
                  {interestTarget?.quantum_id}
                </span>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setInterestTarget(null);
                setSelectedFicheId("");
              }}
              className="text-slate-400"
            >
              Annuler
            </Button>
            {fiches.length > 0 && (
              <Button
                onClick={handleSendInterest}
                disabled={sendingInterest || !selectedFicheId}
                className="bg-quantum-accent hover:bg-quantum-accent/90 text-white"
              >
                {sendingInterest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {sendingInterest ? "Envoi…" : "Confirmer l'intérêt"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
