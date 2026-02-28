import { Suspense } from "react";
import { ConnexionForm } from "./connexion-form";

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-400">Chargement…</div>}>
      <ConnexionForm />
    </Suspense>
  );
}
