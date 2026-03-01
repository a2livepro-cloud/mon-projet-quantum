import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift } from "lucide-react";
import { CopyReferralButton } from "./copy-referral-button";

export default async function CandidatParrainagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: candidatData } = await supabase
    .from("candidats")
    .select("referral_code, xp")
    .eq("id", user.id)
    .single();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, xp_awarded, created_at, referred_id")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const referralCode = candidatData?.referral_code ?? null;
  const validated = referrals?.filter((r) => r.status === "validated").length ?? 0;
  const pending = referrals?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Programme de parrainage</h1>
        <p className="mt-1 text-slate-400">
          Invitez d&apos;autres ingénieurs sur QUANTUM et gagnez 200 XP par parrainage validé.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Parrainages validés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">{validated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-quantum-gold">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">XP gagnés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-quantum-cyan">{validated * 200}</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-quantum-cyan" />
            Votre code de parrainage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referralCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-quantum-cyan/30 bg-quantum-cyan/5 px-4 py-3">
                <p className="flex-1 font-mono text-xl font-bold tracking-widest text-quantum-cyan">
                  {referralCode}
                </p>
                <CopyReferralButton code={referralCode} />
              </div>
              <p className="text-sm text-slate-400">
                Partagez ce code aux ingénieurs que vous souhaitez inviter. Ils devront le saisir lors de leur inscription.
                Vous recevrez 200 XP dès que leur compte sera validé par notre équipe.
              </p>
            </div>
          ) : (
            <p className="text-slate-400">
              Votre code de parrainage sera généré lors de la validation de votre compte. Contactez l&apos;équipe QUANTUM si ce n&apos;est pas le cas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Referral history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            Historique des parrainages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <p className="text-slate-400">Aucun parrainage pour le moment.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {referrals.map((r, i) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Candidat #{i + 1}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.xp_awarded && (
                      <span className="text-xs font-bold text-quantum-gold">+200 XP</span>
                    )}
                    <span
                      className={
                        r.status === "validated"
                          ? "rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400"
                          : "rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400"
                      }
                    >
                      {r.status === "validated" ? "Validé" : "En attente"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
