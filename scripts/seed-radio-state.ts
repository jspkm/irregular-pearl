/**
 * Seeds the radioState/current Firestore document.
 *
 * Usage:
 *   npx tsx scripts/seed-radio-state.ts [trackIndex]
 *
 * trackIndex defaults to 0 if not provided.
 *
 * Requires a .env.local file with NEXT_PUBLIC_FIREBASE_* variables.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const trackIndex = parseInt(process.argv[2] ?? "0", 10);

async function main() {
  await setDoc(doc(db, "radioState", "current"), {
    trackIndex,
    startedAt: serverTimestamp(),
    startedAtMillis: Date.now(),
  });
  console.log(`Seeded radioState/current with trackIndex=${trackIndex}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
