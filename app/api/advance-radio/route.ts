import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { expectedIndex, nextIndex } = await req.json();
    if (typeof expectedIndex !== "number" || typeof nextIndex !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.doc("radioState/current");

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return false;
      const current = snap.data()!;
      if (current.trackIndex !== expectedIndex) return false;

      tx.set(ref, {
        trackIndex: nextIndex,
        startedAt: FieldValue.serverTimestamp(),
        startedAtMillis: Date.now(),
      });
      return true;
    });

    return NextResponse.json({ ok: updated });
  } catch (error) {
    console.error("advance-radio error:", error);
    return NextResponse.json({ error: "Failed to advance" }, { status: 500 });
  }
}
