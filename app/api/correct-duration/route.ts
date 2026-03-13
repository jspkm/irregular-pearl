import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { trackId, durationSeconds } = await req.json();
    if (!trackId || typeof durationSeconds !== "number" || durationSeconds <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("tracks").doc(trackId).update({ durationSeconds });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("correct-duration error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
