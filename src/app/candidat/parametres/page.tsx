import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParametresForm } from "./parametres-form";
import type { Disponibilite } from "@/types/database";

export default async function CandidatParametresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: candidat } = await supabase
    .from("candidats")
    .select("disponibilite")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold text-white">Paramètres</h1>
      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
        </CardHeader>
        <CardContent>
          <ParametresForm
            candidatId={user.id}
            disponibilite={(candidat?.disponibilite as Disponibilite) ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
