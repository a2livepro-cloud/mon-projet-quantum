import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CandidatsTable } from "./candidats-table";

export default async function AdminCandidatsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const filterStatus = status === "pending" ? "pending" : null;

  const query = supabase
    .from("profiles")
    .select("id, full_name, email, status, created_at")
    .eq("role", "candidat")
    .order("created_at", { ascending: false });

  if (filterStatus) query.eq("status", filterStatus);
  const { data: profiles } = await query;

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: candidats } =
    ids.length > 0
      ? await supabase
          .from("candidats")
          .select("id, secteur, annees_experience, disponibilite")
          .in("id", ids)
      : { data: [] };

  const candidatsMap = new Map((candidats ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-syne text-3xl font-bold text-white">
          Candidats
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/candidats"
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Tous
          </Link>
          <Link
            href="/admin/candidats?status=pending"
            className="rounded-md border border-quantum-accent/50 px-3 py-1.5 text-sm text-quantum-accent hover:bg-quantum-accent/10"
          >
            En attente
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidatsTable
            profiles={profiles ?? []}
            candidatsMap={candidatsMap}
          />
        </CardContent>
      </Card>
    </div>
  );
}
