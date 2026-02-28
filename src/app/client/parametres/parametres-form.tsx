"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const SECTEURS = [
  "Prestation / Cabinet de recrutement",
  "Intérim",
  "Industrie",
  "Aéronautique",
  "Autre",
];

const TAILLES = ["1-10", "11-50", "51-200", "200+"];

type Props = {
  initialData: {
    full_name: string;
    nom_entreprise: string;
    secteur_activite: string;
    taille_entreprise: string;
    description_besoin: string;
  };
};

export function ParametresForm({ initialData }: Props) {
  const [fullName, setFullName] = useState(initialData.full_name);
  const [nomEntreprise, setNomEntreprise] = useState(initialData.nom_entreprise);
  const [secteurActivite, setSecteurActivite] = useState(initialData.secteur_activite);
  const [tailleEntreprise, setTailleEntreprise] = useState(initialData.taille_entreprise);
  const [descriptionBesoin, setDescriptionBesoin] = useState(initialData.description_besoin);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, clientRes] = await Promise.all([
      supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null })
        .eq("id", user.id),
      supabase
        .from("clients")
        .update({
          nom_entreprise: nomEntreprise.trim() || null,
          secteur_activite: secteurActivite || null,
          taille_entreprise: tailleEntreprise || null,
          description_besoin: descriptionBesoin.trim() || null,
        })
        .eq("id", user.id),
    ]);

    setLoading(false);

    if (profileRes.error || clientRes.error) {
      toast({
        title: "Erreur",
        description: profileRes.error?.message ?? clientRes.error?.message ?? "Mise à jour impossible",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Profil mis à jour" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations entreprise</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom du contact</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Prénom Nom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nom_entreprise">Nom de l&apos;entreprise</Label>
            <Input
              id="nom_entreprise"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Secteur d&apos;activité</Label>
              <Select value={secteurActivite} onValueChange={setSecteurActivite}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taille de l&apos;entreprise</Label>
              <Select value={tailleEntreprise} onValueChange={setTailleEntreprise}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {TAILLES.map((t) => (
                    <SelectItem key={t} value={t}>{t} salariés</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description_besoin">Description du besoin</Label>
            <Textarea
              id="description_besoin"
              value={descriptionBesoin}
              onChange={(e) => setDescriptionBesoin(e.target.value)}
              rows={3}
              placeholder="Types de profils recherchés..."
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
