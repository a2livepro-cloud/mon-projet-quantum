import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  const adminCode = process.env.ADMIN_INVITE_CODE;

  if (!adminCode) {
    return NextResponse.json(
      { error: "Code admin non configuré sur le serveur." },
      { status: 500 }
    );
  }

  if (!code || code !== adminCode) {
    return NextResponse.json(
      { error: "Code secret invalide." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
