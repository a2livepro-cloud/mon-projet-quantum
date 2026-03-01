import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientsTable } from "./clients-table";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const filterStatus = status === "pending" ? "pending" : null;

  const query = supabase
    .from("profiles")
    .select("id, full_name, email, status, admin_note, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (filterStatus) query.eq("status", filterStatus);
  const { data: profiles } = await query;

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: clients } =
    ids.length > 0
      ? await supabase
          .from("clients")
          .select("id, nom_entreprise, secteurs, secteurs_valides, xp, grade")
          .in("id", ids)
      : { data: [] };

  const clientsMap = new Map((clients ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-syne text-3xl font-bold text-white">
          Clients
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/clients"
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Tous
          </Link>
          <Link
            href="/admin/clients?status=pending"
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
          <ClientsTable profiles={profiles ?? []} clientsMap={clientsMap} />
        </CardContent>
      </Card>
    </div>
  );
}
