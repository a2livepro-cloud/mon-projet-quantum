"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, X } from "lucide-react";

const SECTEURS = [
  "Aéronautique",
  "Automobile",
  "Énergie",
  "Industrie",
  "Informatique",
  "Ingénierie",
  "Spatial",
  "Autre",
];

const TYPES_CONTRAT = ["CDI", "CDD", "Freelance", "Intérim", "Alternance", "Stage"];

export default function NouvelleFichePage() {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [secteur, setSecteur] = useState("");
  const [typeContrat, setTypeContrat] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [anneeExp, setAnneeExp] = useState("");
  const [competenceInput, setCompetenceInput] = useState("");
  const [competences, setCompetences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function addCompetence() {
    const val = competenceInput.trim();
    if (val && !competences.includes(val)) {
      setCompetences((prev) => [...prev, val]);
    }
    setCompetenceInput("");
  }

  function removeCompetence(c: string) {
    setCompetences((prev) => prev.filter((x) => x !== c));
  }

  function handleCompetenceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCompetence();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim()) {
      toast({ title: "Titre requis", description: "Veuillez saisir un titre de poste.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await fetch("/api/fiches-poste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre: titre.trim(),
        description: description.trim() || null,
        secteur: secteur || null,
        type_contrat: typeContrat || null,
        localisation: localisation.trim() || null,
        annees_experience_min: anneeExp ? parseInt(anneeExp) : null,
        competences_requises: competences,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Erreur", description: err.error ?? "Impossible de créer la fiche", variant: "destructive" });
      return;
    }
    toast({ title: "Fiche créée !", description: "Le matching est en cours de calcul." });
    router.push("/client/fiches");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/client/fiches">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h1 className="font-syne text-3xl font-bold text-white">Nouvelle fiche de poste</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du poste</CardTitle>
          <CardDescription>
            Plus votre description est précise, meilleur sera le matching avec les candidats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre du poste *</Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex : Ingénieur calcul structure"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Secteur</Label>
                <Select value={secteur} onValueChange={setSecteur}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTEURS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type de contrat</Label>
                <Select value={typeContrat} onValueChange={setTypeContrat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_CONTRAT.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="localisation">Localisation</Label>
                <Input
                  id="localisation"
                  value={localisation}
                  onChange={(e) => setLocalisation(e.target.value)}
                  placeholder="Paris, Lyon, Toulouse..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Expérience minimale (années)</Label>
                <Input
                  id="exp"
                  type="number"
                  min={0}
                  max={30}
                  value={anneeExp}
                  onChange={(e) => setAnneeExp(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competences">Compétences requises</Label>
              <div className="flex gap-2">
                <Input
                  id="competences"
                  value={competenceInput}
                  onChange={(e) => setCompetenceInput(e.target.value)}
                  onKeyDown={handleCompetenceKeyDown}
                  placeholder="CATIA, FEA, Python... (Entrée pour ajouter)"
                />
                <Button type="button" variant="outline" onClick={addCompetence}>
                  Ajouter
                </Button>
              </div>
              {competences.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {competences.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1 pr-1">
                      {c}
                      <button
                        type="button"
                        onClick={() => removeCompetence(c)}
                        className="ml-1 rounded-full hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description du poste</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mission, contexte, environnement technique, équipe..."
                rows={5}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Création…" : "Créer la fiche et lancer le matching"}
              </Button>
              <Link href="/client/fiches">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
