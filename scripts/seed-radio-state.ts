/**
 * Seeds the radioState/current Firestore document.
 *
 * Usage:
 *   npx tsx scripts/seed-radio-state.ts [trackIndex]
 *
 * trackIndex defaults to 0 if not provided.
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or falls back to project ID.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";

/* ── Firebase Admin init (same pattern as seed-tracks.ts) ── */

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const envProjectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID;

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  const sa = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf-8")
  ) as ServiceAccount;
  initializeApp({ credential: cert(sa) });
} else {
  initializeApp({ projectId: envProjectId || "irregular-pearl-dev" });
}

const db = getFirestore();
const trackIndex = parseInt(process.argv[2] ?? "0", 10);

async function main() {
  await db.doc("radioState/current").set({
    trackIndex,
    startedAt: FieldValue.serverTimestamp(),
    startedAtMillis: Date.now(),
  });
  console.log(`Seeded radioState/current with trackIndex=${trackIndex}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
