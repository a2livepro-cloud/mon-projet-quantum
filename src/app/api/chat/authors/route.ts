import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { authorIds } = await request.json() as { authorIds: string[] };
  if (!Array.isArray(authorIds) || authorIds.length === 0) {
    return NextResponse.json({ authors: [] });
  }

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .in("id", authorIds);

  const { data: candidats } = await admin
    .from("candidats")
    .select("id, grade")
    .in("id", authorIds);

  const { data: clients } = await admin
    .from("clients")
    .select("id, grade")
    .in("id", authorIds);

  const gradeById = new Map<string, string>();
  (candidats ?? []).forEach((c) => gradeById.set(c.id, c.grade));
  (clients ?? []).forEach((c) => gradeById.set(c.id, c.grade));

  const authors = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role,
    grade: gradeById.get(p.id) ?? null,
  }));

  return NextResponse.json({ authors });
}
