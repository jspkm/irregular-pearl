import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let db: Firestore;

function init() {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
    const serviceAccount = JSON.parse(Buffer.from(json, "base64").toString());
    app = initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore(app);
}

export function getAdminDb(): Firestore {
  if (!db) init();
  return db;
}
