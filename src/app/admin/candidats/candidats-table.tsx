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
import { SECTEUR_LABELS, GRADE_LABELS } from "@/types/database";
import type { SecteurCandidat, Grade } from "@/types/database";
import { CheckCircle, XCircle, MessageSquare, FileText, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

const ALL_SECTEURS: SecteurCandidat[] = [
  "aeronautique",
  "automobile",
  "energie",
  "robotique",
  "industrie",
  "bureau_etudes",
];

const ALL_GRADES: Grade[] = ["recrue", "membre", "confirme", "pionnier", "ambassadeur"];

function calcGrade(xp: number): Grade {
  if (xp >= 5000) return "ambassadeur";
  if (xp >= 3000) return "pionnier";
  if (xp >= 1500) return "confirme";
  if (xp >= 500) return "membre";
  return "recrue";
}

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
  xp: number;
  grade: string;
};

type PendingAction = {
  profileId: string;
  newStatus: "approved" | "rejected";
  name: string;
  secteursCandidature: SecteurCandidat[];
};

type EditTarget = {
  candidatId: string;
  name: string;
  secteursValides: SecteurCandidat[];
  xp: number;
  grade: Grade;
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

  // Validation dialog
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [note, setNote] = useState("");
  const [secteursValides, setSecteursValides] = useState<SecteurCandidat[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Search + pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.full_name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function openDialog(profileId: string, newStatus: "approved" | "rejected", name: string) {
    setNote("");
    const c = candidatsMap.get(profileId);
    const candidature = c?.secteurs ?? [];
    setSecteursValides(candidature);
    setPending({ profileId, newStatus, name, secteursCandidature: candidature });
  }

  function openEdit(profileId: string, name: string) {
    const c = candidatsMap.get(profileId);
    setEditTarget({
      candidatId: profileId,
      name,
      secteursValides: (c?.secteurs_valides ?? []) as SecteurCandidat[],
      xp: c?.xp ?? 0,
      grade: (c?.grade as Grade) ?? "recrue",
    });
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
        toast({ title: "Erreur", description: json.error ?? "Une erreur est survenue.", variant: "destructive" });
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

  async function saveEdit() {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/edit-candidat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidatId: editTarget.candidatId,
          secteursValides: editTarget.secteursValides,
          xp: editTarget.xp,
          grade: editTarget.grade,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: json.error ?? "Une erreur est survenue.", variant: "destructive" });
      } else {
        toast({ title: "Candidat mis à jour", description: `${editTarget.name} a été modifié.` });
        setEditTarget(null);
        router.refresh();
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Impossible de joindre l'API.", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  }

  if (profiles.length === 0) {
    return <p className="py-8 text-center text-slate-400">Aucun candidat à afficher.</p>;
  }

  return (
    <>
      {/* Search bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-quantum-accent/50 focus:outline-none focus:ring-1 focus:ring-quantum-accent/50"
          />
        </div>
        <span className="text-xs text-slate-500">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-400">
              <th className="pb-3 pr-4 font-medium">Nom</th>
              <th className="pb-3 pr-4 font-medium">Email</th>
              <th className="pb-3 pr-4 font-medium">Secteurs demandés</th>
              <th className="pb-3 pr-4 font-medium">Expérience</th>
              <th className="pb-3 pr-4 font-medium">XP / Rang</th>
              <th className="pb-3 pr-4 font-medium">Statut</th>
              <th className="pb-3 pr-4 font-medium">Note admin</th>
              <th className="pb-3 pr-4 font-medium">CV</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Aucun résultat pour &laquo;&nbsp;{search}&nbsp;&raquo;
                </td>
              </tr>
            )}
            {visible.map((p) => {
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
                    {c ? (
                      <div className="space-y-0.5">
                        <p className="text-slate-200 font-medium">{c.xp} XP</p>
                        <p className="text-xs text-quantum-gold capitalize">
                          {(GRADE_LABELS as Record<string, string>)[c.grade] ?? c.grade}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
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
                    <div className="flex flex-wrap gap-2">
                      {p.status === "pending" && (
                        <>
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
                        </>
                      )}
                      {p.status === "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 border border-white/10 text-slate-300 hover:border-quantum-accent/40 hover:text-quantum-accent"
                          onClick={() => openEdit(p.id, p.full_name ?? "Ce candidat")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Éditer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {currentPage + 1} / {totalPages}
            {" · "}
            {filtered.length} candidat{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Préc.
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suiv.
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dialog validation */}
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

          {pending?.newStatus === "approved" && (
            <div className="mt-2 space-y-2">
              <p className="text-sm font-medium text-slate-300">
                Canaux autorisés{" "}
                <span className="font-normal text-slate-500">(cochez les secteurs que vous validez)</span>
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-quantum-bg p-3">
                {ALL_SECTEURS.map((s) => {
                  const demande = pending.secteursCandidature.includes(s);
                  return (
                    <label key={s} className={`flex cursor-pointer items-center gap-2 ${!demande ? "opacity-40" : ""}`}>
                      <Checkbox
                        checked={secteursValides.includes(s)}
                        onCheckedChange={(checked) =>
                          setSecteursValides(checked ? [...secteursValides, s] : secteursValides.filter((x) => x !== s))
                        }
                      />
                      <span className="text-sm text-slate-300">
                        {SECTEUR_LABELS[s]}
                        {demande && <span className="ml-1 text-[10px] text-quantum-accent">demandé</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-2 space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Note interne <span className="text-slate-500 font-normal">(optionnelle)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                pending?.newStatus === "approved"
                  ? "Ex : Profil vérifié, 8 ans en aéronautique…"
                  : "Ex : CV incomplet, compétences hors scope…"
              }
              className="w-full rounded-lg border border-white/10 bg-quantum-bg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-quantum-accent/50 focus:outline-none focus:ring-1 focus:ring-quantum-accent/50 resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPending(null)} disabled={loading} className="text-slate-400">
              Annuler
            </Button>
            <Button
              onClick={confirm}
              disabled={loading}
              className={pending?.newStatus === "approved" ? "gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white" : "gap-1.5 bg-red-600 hover:bg-red-500 text-white"}
            >
              {loading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : pending?.newStatus === "approved" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {loading ? "En cours…" : pending?.newStatus === "approved" ? "Confirmer la validation" : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog édition candidat approuvé */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-quantum-accent">
              Éditer — {editTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Modifiez les canaux, l&apos;XP et le rang manuellement.
            </DialogDescription>
          </DialogHeader>

          {/* Canaux */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Canaux autorisés</p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-quantum-bg p-3">
              {ALL_SECTEURS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={editTarget?.secteursValides.includes(s) ?? false}
                    onCheckedChange={(checked) => {
                      if (!editTarget) return;
                      setEditTarget({
                        ...editTarget,
                        secteursValides: checked
                          ? [...editTarget.secteursValides, s]
                          : editTarget.secteursValides.filter((x) => x !== s),
                      });
                    }}
                  />
                  <span className="text-sm text-slate-300">{SECTEUR_LABELS[s]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* XP */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Points XP</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={editTarget?.xp ?? 0}
                onChange={(e) => {
                  if (!editTarget) return;
                  const xp = Math.max(0, parseInt(e.target.value) || 0);
                  setEditTarget({ ...editTarget, xp });
                }}
                className="w-full rounded-lg border border-white/10 bg-quantum-bg px-3 py-2 text-sm text-slate-200 focus:border-quantum-accent/50 focus:outline-none focus:ring-1 focus:ring-quantum-accent/50"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                title="Recalculer le rang depuis l'XP"
                className="shrink-0 border border-white/10 text-xs text-slate-400 hover:text-slate-200"
                onClick={() => {
                  if (!editTarget) return;
                  setEditTarget({ ...editTarget, grade: calcGrade(editTarget.xp) });
                }}
              >
                → Rang
              </Button>
            </div>
            <p className="text-xs text-slate-600">
              Seuils : 0 Recrue · 500 Membre · 1 500 Confirmé · 3 000 Pionnier · 5 000 Ambassadeur
            </p>
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Rang</label>
            <div className="grid grid-cols-5 gap-1.5">
              {ALL_GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => editTarget && setEditTarget({ ...editTarget, grade: g })}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    editTarget?.grade === g
                      ? "border-quantum-gold bg-quantum-gold/15 text-quantum-gold"
                      : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                  }`}
                >
                  {(GRADE_LABELS as Record<string, string>)[g]}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={editLoading} className="text-slate-400">
              Annuler
            </Button>
            <Button
              onClick={saveEdit}
              disabled={editLoading}
              className="gap-1.5 bg-quantum-accent hover:bg-quantum-accent/90 text-white"
            >
              {editLoading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Pencil className="h-4 w-4" />}
              {editLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
