"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
};
type ClientRow = {
  id: string;
  nom_entreprise: string | null;
  secteur_activite: string | null;
};

export function ClientsTable({
  profiles,
  clientsMap,
}: {
  profiles: Profile[];
  clientsMap: Map<string, ClientRow>;
}) {
  const router = useRouter();

  async function handleStatus(
    profileId: string,
    newStatus: "approved" | "rejected",
    motif?: string
  ) {
    const res = await fetch("/api/admin/validate-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, newStatus, motif }),
    });
    if (res.ok) router.refresh();
  }

  if (profiles.length === 0) {
    return (
      <p className="py-8 text-center text-slate-400">
        Aucun client à afficher.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-slate-400">
            <th className="pb-2 pr-4">Contact</th>
            <th className="pb-2 pr-4">Email</th>
            <th className="pb-2 pr-4">Entreprise</th>
            <th className="pb-2 pr-4">Secteur</th>
            <th className="pb-2 pr-4">Statut</th>
            <th className="pb-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => {
            const c = clientsMap.get(p.id);
            return (
              <tr key={p.id} className="border-b border-white/5">
                <td className="py-3 pr-4 text-white">{p.full_name ?? "—"}</td>
                <td className="py-3 pr-4 text-slate-300">{p.email ?? "—"}</td>
                <td className="py-3 pr-4 text-slate-300">
                  {c?.nom_entreprise ?? "—"}
                </td>
                <td className="py-3 pr-4 text-slate-300">
                  {c?.secteur_activite ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      p.status === "approved"
                        ? "text-green-400"
                        : p.status === "rejected"
                        ? "text-red-400"
                        : "text-quantum-gold"
                    }
                  >
                    {p.status === "pending"
                      ? "En attente"
                      : p.status === "approved"
                      ? "Approuvé"
                      : "Refusé"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {p.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatus(p.id, "approved")}
                      >
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatus(p.id, "rejected")}
                      >
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
  );
}
