"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";
import type { Candidat } from "@/types/database";
import { SECTEUR_LABELS, DISPO_LABELS, MOBILITE_LABELS } from "@/types/database";
import type { SecteurCandidat, AnneesExperience, Disponibilite, Mobilite } from "@/types/database";

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

export function ProfilForm({ candidat }: { candidat: Candidat | null }) {
  const [secteur, setSecteur] = useState<SecteurCandidat | "">(
    (candidat?.secteur as SecteurCandidat) ?? ""
  );
  const [anneesExperience, setAnneesExperience] = useState<AnneesExperience | "">(
    (candidat?.annees_experience as AnneesExperience) ?? ""
  );
  const [disponibilite, setDisponibilite] = useState<Disponibilite | "">(
    (candidat?.disponibilite as Disponibilite) ?? ""
  );
  const [localisation, setLocalisation] = useState(candidat?.localisation ?? "");
  const [mobilite, setMobilite] = useState<Mobilite | "">(
    (candidat?.mobilite as Mobilite) ?? ""
  );
  const [competencesStr, setCompetencesStr] = useState(
    candidat?.competences?.join(", ") ?? ""
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const competences = competencesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error } = await supabase
      .from("candidats")
      .update({
        secteur: secteur || null,
        annees_experience: anneesExperience || null,
        disponibilite: disponibilite || null,
        localisation: localisation.trim() || null,
        mobilite: mobilite || null,
        competences,
      })
      .eq("id", candidat!.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    await fetch("/api/xp/profil-complet", { method: "POST" });
    toast({ title: "Profil mis à jour" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Secteur</Label>
        <Select value={secteur} onValueChange={(v) => setSecteur(v as SecteurCandidat)}>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="localisation">Localisation</Label>
          <Input
            id="localisation"
            placeholder="Toulouse, Paris…"
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Mobilité</Label>
          <Select value={mobilite} onValueChange={(v) => setMobilite(v as Mobilite)}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir" />
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

      <div className="space-y-2">
        <Label htmlFor="competences">Compétences / logiciels (séparés par des virgules)</Label>
        <Input
          id="competences"
          placeholder="CATIA, FEA, CFD, SolidWorks…"
          value={competencesStr}
          onChange={(e) => setCompetencesStr(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
