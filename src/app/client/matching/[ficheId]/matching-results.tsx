"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SECTEUR_LABELS, DISPO_LABELS, GRADE_LABELS } from "@/types/database";
import type { SecteurCandidat, Disponibilite, Grade } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

type MatchRow = {
  candidat_id: string;
  quantum_id: string;
  secteur: SecteurCandidat | null;
  annees_experience: string | null;
  disponibilite: Disponibilite | null;
  competences: string[];
  score: number;
  grade: Grade;
};

export function MatchingResults({ ficheId }: { ficheId: string }) {
  const [results, setResults] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [interested, setInterested] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/matching/${ficheId}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [ficheId]);

  async function handleInterested(candidatId: string) {
    const res = await fetch("/api/client/interested", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ficheId, candidatId }),
    });
    if (res.ok) {
      setInterested((prev) => new Set(prev).add(candidatId));
      toast({
        title: "Demande envoyée",
        description: "L'équipe Quantum vous recontactera pour la mise en relation.",
      });
    } else {
      toast({
        title: "Erreur",
        variant: "destructive",
        description: "Impossible d'envoyer la demande.",
      });
    }
  }

  if (loading) {
    return <p className="text-slate-400">Chargement des profils matchés…</p>;
  }
  if (results.length === 0) {
    return (
      <p className="text-slate-400">
        Aucun profil pour le moment. Les candidats complètent leurs profils pour apparaître ici.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((r) => (
        <Card key={r.candidat_id}>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono font-bold text-quantum-cyan">{r.quantum_id}</p>
                <p className="text-sm text-slate-400">
                  {r.secteur ? (SECTEUR_LABELS as Record<string, string>)[r.secteur] : "—"} ·{" "}
                  {r.annees_experience ?? "—"} ans ·{" "}
                  {r.disponibilite ? (DISPO_LABELS as Record<string, string>)[r.disponibilite] : "—"}
                </p>
                <p className="text-sm text-slate-400">
                  Grade : {GRADE_LABELS[r.grade]}
                </p>
                {r.competences.length > 0 && (
                  <p className="mt-2 text-sm text-slate-300">
                    Compétences : {r.competences.join(", ")}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-24 text-right">
                  <p className="text-2xl font-bold text-quantum-gold">
                    {Math.round(r.score * 100)}%
                  </p>
                  <Progress value={r.score * 100} className="h-2" />
                </div>
                {interested.has(r.candidat_id) ? (
                  <span className="text-sm text-green-400">Demande envoyée</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInterested(r.candidat_id)}
                  >
                    Je veux aller plus loin
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
