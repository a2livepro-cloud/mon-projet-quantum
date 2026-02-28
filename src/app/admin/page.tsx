import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Building, FileText, Handshake } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: candidatsPending },
    { count: clientsPending },
    { count: fichesActive },
    { count: matchingsSuggested },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "candidat")
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "client")
      .eq("status", "pending"),
    supabase
      .from("fiches_poste")
      .select("id", { count: "exact", head: true })
      .eq("statut", "active"),
    supabase
      .from("matchings")
      .select("id", { count: "exact", head: true })
      .eq("statut", "suggested"),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-syne text-3xl font-bold text-white">
        Dashboard admin
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Candidats en attente
            </CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{candidatsPending ?? 0}</p>
            <Link href="/admin/candidats?status=pending">
              <Button variant="link" className="p-0 h-auto text-quantum-accent">
                Voir et valider
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Clients en attente
            </CardTitle>
            <Building className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{clientsPending ?? 0}</p>
            <Link href="/admin/clients?status=pending">
              <Button variant="link" className="p-0 h-auto text-quantum-accent">
                Voir et valider
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Fiches actives
            </CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{fichesActive ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Matchings suggérés
            </CardTitle>
            <Handshake className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{matchingsSuggested ?? 0}</p>
            <Link href="/admin/matchings">
              <Button variant="link" className="p-0 h-auto text-quantum-accent">
                Voir
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
