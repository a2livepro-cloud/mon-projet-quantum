"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CHAT_CHANNELS, CHAT_CHANNEL_LABELS } from "@/types/database";
import { GRADE_LABELS } from "@/types/database";
import type { Grade, SecteurCandidat } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";
import { Shield } from "lucide-react";

// Canaux secteur → valeur enum candidats
const SECTEUR_CHANNEL_MAP: Record<string, SecteurCandidat> = {
  aeronautique: "aeronautique",
  automobile: "automobile",
  energie: "energie",
  robotique: "robotique",
  industrie: "industrie",
  "bureau-detudes": "bureau_etudes",
};

// Canaux accessibles à tous (pas de restriction secteur)
const CANAUX_GENERAUX = ["general", "annonces", "parrainage", "offres-missions", "conseils-carriere"];

const LIMIT = 50;

type AuthorRole = "candidat" | "client" | "admin";

function formatName(fullName: string | null): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

type MessageRow = {
  id: string;
  channel: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string | null;
    role?: AuthorRole;
    grade?: Grade;
  } | null;
};

function AuthorBadge({ role, grade }: { role?: AuthorRole; grade?: Grade }) {
  if (role === "admin") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-quantum-gold/15 px-2 py-0.5 text-[10px] font-bold text-quantum-gold">
        <Shield className="h-2.5 w-2.5" />
        Admin
      </span>
    );
  }
  if (role === "client") {
    return (
      <span className="ml-2 rounded-full bg-quantum-accent/15 px-2 py-0.5 text-[10px] font-semibold text-quantum-accent">
        Client
      </span>
    );
  }
  // candidat
  return (
    <>
      <span className="ml-2 rounded-full bg-quantum-cyan/15 px-2 py-0.5 text-[10px] font-semibold text-quantum-cyan">
        Candidat
      </span>
      {grade && (
        <span className="ml-1 text-[10px] text-quantum-gold">
          · {(GRADE_LABELS as Record<string, string>)[grade]}
        </span>
      )}
    </>
  );
}

export function ChatRoom() {
  const [allowedChannels, setAllowedChannels] = useState<string[]>([...CHAT_CHANNELS]);
  const [channel, setChannel] = useState<string>(CHAT_CHANNELS[0]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { toast } = useToast();

  // Charger les canaux autorisés selon le rôle/secteurs_valides
  useEffect(() => {
    async function fetchAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Admins voient tous les canaux
      if (!profile || profile.role === "admin") {
        setAllowedChannels([...CHAT_CHANNELS]);
        return;
      }

      // Candidats et clients : canaux généraux + secteurs validés par l'admin
      let secteursValides: SecteurCandidat[] = [];

      if (profile.role === "candidat") {
        const { data: candidat } = await supabase
          .from("candidats")
          .select("secteurs_valides")
          .eq("id", user.id)
          .single();
        secteursValides = candidat?.secteurs_valides ?? [];
      } else if (profile.role === "client") {
        const { data: client } = await supabase
          .from("clients")
          .select("secteurs_valides")
          .eq("id", user.id)
          .single();
        secteursValides = client?.secteurs_valides ?? [];
      }

      const allowed = [
        ...CANAUX_GENERAUX,
        ...Object.entries(SECTEUR_CHANNEL_MAP)
          .filter(([, secteur]) => secteursValides.includes(secteur))
          .map(([channel]) => channel),
      ];

      setAllowedChannels(allowed);
      setChannel((prev) => (allowed.includes(prev) ? prev : allowed[0] ?? CHAT_CHANNELS[0]));
    }
    fetchAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger les messages et enrichir avec profil + rôle + grade via API (bypass RLS)
  async function enrichMessages(rows: Omit<MessageRow, "author">[]) {
    const authorIds = Array.from(new Set(rows.map((m) => m.author_id)));
    if (authorIds.length === 0) return rows.map((m) => ({ ...m, author: null }));

    let authorList: { id: string; full_name: string | null; role: string; grade: string | null }[] = [];
    try {
      const res = await fetch("/api/chat/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorIds }),
      });
      if (res.ok) {
        const json = await res.json();
        authorList = json.authors ?? [];
      }
    } catch {
      // silently fail
    }

    const authorById = new Map(authorList.map((a) => [a.id, a]));

    return rows.map((m) => {
      const a = authorById.get(m.author_id);
      return {
        ...m,
        author: {
          full_name: a?.full_name ?? null,
          role: (a?.role ?? "candidat") as AuthorRole,
          grade: (a?.grade ?? undefined) as Grade | undefined,
        },
      };
    });
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, channel, author_id, content, created_at")
        .eq("channel", channel)
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      const rows = (data ?? []).reverse();
      const enriched = await enrichMessages(rows);
      setMessages(enriched);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => {
    const channelName = `messages:channel=eq.${channel}`;
    const sub = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel=eq.${channel}`,
        },
        async (payload) => {
          const newRow = payload.new as Omit<MessageRow, "author">;
          const [enriched] = await enrichMessages([newRow]);
          setMessages((prev) => [...prev, enriched]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    if (!allowedChannels.includes(channel)) {
      toast({ title: "Accès refusé", description: "Vous n'avez pas accès à ce canal.", variant: "destructive" });
      return;
    }
    setInput("");
    const { error } = await supabase.from("messages").insert({
      channel,
      author_id: (await supabase.auth.getUser()).data.user?.id,
      content: text.slice(0, 2000),
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    fetch("/api/xp/message", { method: "POST" }).catch(() => {});
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="flex gap-4">
      <div className="w-48 shrink-0 space-y-1">
        {/* Canaux généraux */}
        {CANAUX_GENERAUX.filter((ch) => allowedChannels.includes(ch)).map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => setChannel(ch)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              channel === ch
                ? "bg-quantum-accent/20 text-quantum-accent"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            #{(CHAT_CHANNEL_LABELS as Record<string, string>)[ch] ?? ch}
          </button>
        ))}

        {/* Canaux secteurs */}
        {Object.keys(SECTEUR_CHANNEL_MAP).some((ch) => allowedChannels.includes(ch)) && (
          <>
            <p className="px-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Secteurs
            </p>
            {Object.keys(SECTEUR_CHANNEL_MAP)
              .filter((ch) => allowedChannels.includes(ch))
              .map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    channel === ch
                      ? "bg-quantum-accent/20 text-quantum-accent"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  #{(CHAT_CHANNEL_LABELS as Record<string, string>)[ch] ?? ch}
                </button>
              ))}
          </>
        )}
      </div>

      <Card className="flex flex-1 flex-col">
        <CardHeader className="border-b border-white/10 py-3">
          <p className="font-syne font-bold text-white">
            #{(CHAT_CHANNEL_LABELS as Record<string, string>)[channel] ?? channel}
          </p>
          <p className="text-xs text-slate-400">
            Texte uniquement — pas de fichiers ni images
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="flex max-h-[60vh] flex-1 flex-col overflow-y-auto p-4">
            {loading ? (
              <p className="text-slate-400">Chargement…</p>
            ) : (
              <>
                {messages.map((m) => (
                  <div key={m.id} className="border-b border-white/5 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-x-1">
                      <span className="font-semibold text-slate-200">
                        {formatName(m.author?.full_name ?? null) || "—"}
                      </span>
                      <AuthorBadge role={m.author?.role} grade={m.author?.grade} />
                      <span className="ml-2 text-slate-500 text-xs">
                        {new Date(m.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-300">{m.content}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-white/10 p-4"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre message (texte uniquement)"
              maxLength={2000}
            />
            <Button type="submit">Envoyer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
