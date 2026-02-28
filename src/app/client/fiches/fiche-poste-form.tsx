"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function FichePosteForm({ clientId: _clientId }: { clientId: string }) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [secteur, setSecteur] = useState("");
  const [competencesStr, setCompetencesStr] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [typeContrat, setTypeContrat] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const competences = competencesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/fiches-poste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre: titre || null,
        description: description || null,
        secteur: secteur || null,
        competences_requises: competences,
        localisation: localisation || null,
        type_contrat: typeContrat || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Erreur",
        description: err.error ?? "Impossible de créer la fiche",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Fiche créée. Matching en cours de calcul." });
    setTitre("");
    setDescription("");
    setSecteur("");
    setCompetencesStr("");
    setLocalisation("");
    setTypeContrat("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="titre">Titre du poste</Label>
        <Input
          id="titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ingénieur calcul..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mission, contexte..."
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="secteur">Secteur</Label>
        <Input
          id="secteur"
          value={secteur}
          onChange={(e) => setSecteur(e.target.value)}
          placeholder="Aéronautique, Automobile..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="competences">Compétences requises (virgules)</Label>
        <Input
          id="competences"
          value={competencesStr}
          onChange={(e) => setCompetencesStr(e.target.value)}
          placeholder="CATIA, FEA, CFD..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="localisation">Localisation</Label>
          <Input
            id="localisation"
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type_contrat">Type de contrat</Label>
          <Input
            id="type_contrat"
            value={typeContrat}
            onChange={(e) => setTypeContrat(e.target.value)}
            placeholder="CDI, CDD, freelance..."
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Création…" : "Créer la fiche"}
      </Button>
    </form>
  );
}
