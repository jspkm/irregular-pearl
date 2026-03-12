
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  const sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8")) as ServiceAccount;
  initializeApp({ credential: cert(sa) });
} else {
  initializeApp({ projectId: envProjectId || "irregular-pearl-dev" });
}

const db = getFirestore();

async function check() {
  const tracksSnap = await db.collection("tracks").get();
  console.log(`Tracks in DB: ${tracksSnap.size}`);

  const playlistsSnap = await db.collection("playlists").where("ownerId", "==", null).get();
  console.log(`Master Playlists in DB: ${playlistsSnap.size}`);

  playlistsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Playlist: ${data.name}, Tracks Count: ${data.trackIds?.length || 0}`);
    if (data.trackIds) {
        console.log(`First 5 Track IDs: ${JSON.stringify(data.trackIds.slice(0, 5))}`);
    }
  });
}

check();
