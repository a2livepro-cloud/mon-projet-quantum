"use client";

import { Check, X } from "lucide-react";

const RULES = [
  { label: "8 caractères minimum", test: (p: string) => p.length >= 8 },
  { label: "1 majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 minuscule", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 chiffre", test: (p: string) => /[0-9]/.test(p) },
  { label: "1 caractère spécial (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordRules({ password, visible }: { password: string; visible: boolean }) {
  if (!visible) return null;

  return (
    <ul className="mt-2 space-y-1 rounded-lg border border-white/10 bg-quantum-surface px-3 py-2">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-2 text-xs">
            {ok ? (
              <Check className="h-3 w-3 shrink-0 text-green-400" />
            ) : (
              <X className="h-3 w-3 shrink-0 text-slate-500" />
            )}
            <span className={ok ? "text-green-400" : "text-slate-400"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
