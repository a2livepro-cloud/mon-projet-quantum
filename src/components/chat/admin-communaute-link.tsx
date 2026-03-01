"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const LS_KEY = "communaute_last_seen";

export function AdminCommunauteLink() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/admin/communaute");
  const [unread, setUnread] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isActive) {
      localStorage.setItem(LS_KEY, new Date().toISOString());
      setUnread(false);
      return;
    }

    async function check() {
      const lastSeen = localStorage.getItem(LS_KEY);
      let q = supabase.from("messages").select("*", { count: "exact", head: true });
      if (lastSeen) q = q.gt("created_at", lastSeen);
      const { count } = await q;
      setUnread((count ?? 0) > 0);
    }
    check();

    const sub = supabase
      .channel("notif-communaute-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        setUnread(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <Link href="/admin/communaute">
      <Button variant="ghost" size="sm" className="relative gap-2">
        <MessageSquare className="h-4 w-4" />
        Communauté
        {unread && !isActive && (
          <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </Button>
    </Link>
  );
}
