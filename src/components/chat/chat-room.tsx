"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CHAT_CHANNELS, CHAT_CHANNEL_LABELS } from "@/types/database";
import { GRADE_LABELS } from "@/types/database";
import type { Grade } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_LIST = CHAT_CHANNELS;
const LIMIT = 50;

type MessageRow = {
  id: string;
  channel: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string | null; grade?: Grade } | null;
};

export function ChatRoom() {
  const [channel, setChannel] = useState<string>(CHANNEL_LIST[0]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { toast } = useToast();

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
      const authorIds = Array.from(new Set(rows.map((m) => m.author_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", authorIds);
      const { data: candidats } = await supabase
        .from("candidats")
        .select("id, grade")
        .in("id", authorIds);
      const { data: clients } = await supabase
        .from("clients")
        .select("id, grade")
        .in("id", authorIds);
      const gradeById = new Map<string, Grade>();
      (candidats ?? []).forEach((c) => gradeById.set(c.id, c.grade as Grade));
      (clients ?? []).forEach((c) => gradeById.set(c.id, c.grade as Grade));
      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
      setMessages(
        rows.map((m) => ({
          ...m,
          author: {
            full_name: profileById.get(m.author_id)?.full_name ?? null,
            grade: gradeById.get(m.author_id),
          },
        }))
      );
      setLoading(false);
    }
    load();
  }, [channel, supabase]);

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
        (payload) => {
          const newRow = payload.new as MessageRow;
          const addWithAuthor = async () => {
            const { data: p } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newRow.author_id)
              .single();
            const { data: c } = await supabase
              .from("candidats")
              .select("grade")
              .eq("id", newRow.author_id)
              .single();
            const { data: cl } = await supabase
              .from("clients")
              .select("grade")
              .eq("id", newRow.author_id)
              .single();
            const grade = (c?.grade ?? cl?.grade) as Grade | undefined;
            setMessages((prev) => [
              ...prev,
              {
                ...newRow,
                author: { full_name: p?.full_name ?? null, grade },
              },
            ]);
          };
          addWithAuthor();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel, supabase]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const { error } = await supabase.from("messages").insert({
      channel,
      author_id: (await supabase.auth.getUser()).data.user?.id,
      content: text.slice(0, 2000),
    });
    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    fetch("/api/xp/message", { method: "POST" }).catch(() => {});
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="flex gap-4">
      <div className="w-48 shrink-0 space-y-1">
        {CHANNEL_LIST.map((ch) => (
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
                  <div
                    key={m.id}
                    className="border-b border-white/5 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-200">
                      {m.author?.full_name ?? "Anonyme"}
                    </span>
                    {m.author?.grade && (
                      <span className="ml-2 text-xs text-quantum-gold">
                        {(GRADE_LABELS as Record<string, string>)[m.author.grade]}
                      </span>
                    )}
                    <span className="ml-2 text-slate-500 text-xs">
                      {new Date(m.created_at).toLocaleString("fr-FR")}
                    </span>
                    <p className="mt-0.5 text-slate-300">{m.content}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-white/10 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
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
