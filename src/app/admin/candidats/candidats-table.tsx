"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SECTEUR_LABELS } from "@/types/database";
import type { SecteurCandidat } from "@/types/database";
import { CheckCircle, XCircle, MessageSquare, FileText } from "lucide-react";

const ALL_SECTEURS: SecteurCandidat[] = [
  "aeronautique",
  "automobile",
  "energie",
  "robotique",
  "industrie",
  "bureau_etudes",
];

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};
type CandidatRow = {
  id: string;
  secteurs: SecteurCandidat[];
  secteurs_valides: SecteurCandidat[];
  annees_experience: string | null;
  disponibilite: string | null;
  cv_url: string | null;
};

type PendingAction = {
  profileId: string;
  newStatus: "approved" | "rejected";
  name: string;
  secteursCandidature: SecteurCandidat[];
};

const STATUS_CONFIG = {
  pending:  { label: "En attente",  className: "text-quantum-gold" },
  approved: { label: "Approuvé",    className: "text-green-400" },
  rejected: { label: "Refusé",      className: "text-red-400" },
} as const;

export function CandidatsTable({
  profiles,
  candidatsMap,
}: {
  profiles: Profile[];
  candidatsMap: Map<string, CandidatRow>;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [note, setNote] = useState("");
  const [secteursValides, setSecteursValides] = useState<SecteurCandidat[]>([]);
  const [loading, setLoading] = useState(false);

  function openDialog(profileId: string, newStatus: "approved" | "rejected", name: string) {
    setNote("");
    const c = candidatsMap.get(profileId);
    const candidature = c?.secteurs ?? [];
    setSecteursValides(candidature); // pré-cocher tous les secteurs demandés
    setPending({ profileId, newStatus, name, secteursCandidature: candidature });
  }

  async function openCv(candidatId: string) {
    try {
      const res = await fetch("/api/admin/cv-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidatId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: json.error ?? "Impossible d'ouvrir le CV.", variant: "destructive" });
        return;
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: "Erreur réseau", description: "Impossible de joindre l'API.", variant: "destructive" });
    }
  }

  async function confirm() {
    if (!pending) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/validate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: pending.profileId,
          newStatus: pending.newStatus,
          adminNote: note.trim() || undefined,
          secteursValides: pending.newStatus === "approved" ? secteursValides : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Erreur",
          description: json.error ?? "Une erreur est survenue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: pending.newStatus === "approved" ? "Candidat validé" : "Candidat refusé",
          description: pending.newStatus === "approved"
            ? `${pending.name} a accès à la plateforme (${secteursValides.length} secteur(s) activé(s)).`
            : `${pending.name} a été refusé.`,
        });
        setPending(null);
        router.refresh();
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Impossible de joindre l'API.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (profiles.length === 0) {
    return <p className="py-8 text-center text-slate-400">Aucun candidat à afficher.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-400">
              <th className="pb-3 pr-4 font-medium">Nom</th>
              <th className="pb-3 pr-4 font-medium">Email</th>
              <th className="pb-3 pr-4 font-medium">Secteurs demandés</th>
              <th className="pb-3 pr-4 font-medium">Expérience</th>
              <th className="pb-3 pr-4 font-medium">Statut</th>
              <th className="pb-3 pr-4 font-medium">Note admin</th>
              <th className="pb-3 pr-4 font-medium">CV</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const c = candidatsMap.get(p.id);
              const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
              const secteurs = c?.secteurs ?? [];
              const valides = c?.secteurs_valides ?? [];
              return (
                <tr key={p.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-medium text-white">{p.full_name ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate-300">{p.email ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {secteurs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {secteurs.map((s) => {
                          const isValide = valides.includes(s);
                          return (
                            <span
                              key={s}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isValide
                                  ? "bg-green-500/15 text-green-400"
                                  : "bg-white/5 text-slate-400"
                              }`}
                            >
                              {SECTEUR_LABELS[s]}
                              {isValide && " ✓"}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    {c?.annees_experience ? `${c.annees_experience} ans` : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`font-medium ${cfg.className}`}>{cfg.label}</span>
                  </td>
                  <td className="py-3 pr-4 max-w-[180px]">
                    {p.admin_note ? (
                      <span className="flex items-start gap-1 text-slate-400 text-xs italic">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-slate-500" />
                        <span className="truncate">{p.admin_note}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {c?.cv_url ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-quantum-cyan hover:text-quantum-cyan hover:bg-quantum-cyan/10"
                        onClick={() => openCv(p.id)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Voir CV
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    {p.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                          onClick={() => openDialog(p.id, "approved", p.full_name ?? "Ce candidat")}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => openDialog(p.id, "rejected", p.full_name ?? "Ce candidat")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Refuser
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={pending?.newStatus === "approved" ? "text-emerald-400" : "text-red-400"}>
              {pending?.newStatus === "approved" ? "Valider ce candidat" : "Refuser ce candidat"}
            </DialogTitle>
            <DialogDescription>
              {pending?.newStatus === "approved"
                ? `${pending?.name} aura accès à la plateforme et apparaîtra dans les matchings.`
                : `${pending?.name} sera informé que sa demande a été refusée.`}
            </DialogDescription>
          </DialogHeader>

          {/* Secteurs à valider — uniquement à l'approbation */}
          {pending?.newStatus === "approved" && (
            <div className="mt-2 space-y-2">
              <p className="text-sm font-medium text-slate-300">
                Canaux autorisés{" "}
                <span className="font-normal text-slate-500">
                  (cochez les secteurs que vous validez)
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-quantum-bg p-3">
                {ALL_SECTEURS.map((s) => {
                  const demande = pending.secteursCandidature.includes(s);
                  return (
                    <label
                      key={s}
                      className={`flex cursor-pointer items-center gap-2 ${!demande ? "opacity-40" : ""}`}
                    >
                      <Checkbox
                        checked={secteursValides.includes(s)}
                        onCheckedChange={(checked) =>
                          setSecteursValides(
                            checked
                              ? [...secteursValides, s]
                              : secteursValides.filter((x) => x !== s)
                          )
                        }
                      />
                      <span className="text-sm text-slate-300">
                        {SECTEUR_LABELS[s]}
                        {demande && (
                          <span className="ml-1 text-[10px] text-quantum-accent">demandé</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Les secteurs cochés définissent les canaux de chat accessibles au candidat.
              </p>
            </div>
          )}

          <div className="mt-2 space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Note interne{" "}
              <span className="text-slate-500 font-normal">(optionnelle — visible uniquement par les admins)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                pending?.newStatus === "approved"
                  ? "Ex : Profil vérifié, 8 ans en aéronautique, disponible immédiatement…"
                  : "Ex : CV incomplet, compétences hors scope, doublon…"
              }
              className="w-full rounded-lg border border-white/10 bg-quantum-bg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-quantum-accent/50 focus:outline-none focus:ring-1 focus:ring-quantum-accent/50 resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setPending(null)}
              disabled={loading}
              className="text-slate-400"
            >
              Annuler
            </Button>
            <Button
              onClick={confirm}
              disabled={loading}
              className={
                pending?.newStatus === "approved"
                  ? "gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "gap-1.5 bg-red-600 hover:bg-red-500 text-white"
              }
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : pending?.newStatus === "approved" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {loading
                ? "En cours…"
                : pending?.newStatus === "approved"
                ? "Confirmer la validation"
                : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
