import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParametresForm } from "./parametres-form";

export default async function ClientParametresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: clientData } = await supabase
    .from("clients")
    .select("nom_entreprise, secteur_activite, taille_entreprise, description_besoin")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Paramètres</h1>
        <p className="mt-1 text-slate-400">Gérez vos informations et préférences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-slate-400">Email</span>
              <span className="text-white">{profile?.email ?? user.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Compte créé le</span>
              <span className="text-white">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ParametresForm
        initialData={{
          full_name: profile?.full_name ?? "",
          nom_entreprise: clientData?.nom_entreprise ?? "",
          secteur_activite: clientData?.secteur_activite ?? "",
          taille_entreprise: clientData?.taille_entreprise ?? "",
          description_besoin: clientData?.description_besoin ?? "",
        }}
      />
    </div>
  );
}
