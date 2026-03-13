import { onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { initializeApp } from "firebase-admin/app";

const app = initializeApp();
const db = getFirestore(app);

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const musicalInsight = onRequest(
  { secrets: [geminiApiKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { title, composer, performers } = req.body;
      const apiKey = geminiApiKey.value();

      if (!apiKey) {
        res.status(500).json({ error: "API key not configured" });
        return;
      }

      const prompt = `Write a fascinating, multi-sentence musical insight about "${title}" composed by ${composer}, performed by ${performers.join(", ")}.

    The insight should be rich and detailed (approx. 250-400 characters), exploring:
    - Information about the performer(s).
    - What was happening culturally and artistically when the piece was composed or first performed.
    - A brief music theory insight into this specific piece (e.g., harmonic structure, motif, or tonal innovations).

    Avoid introductory phrases like "Did you know". Make it feel like an immersive program note whispered to the listener.
    Vary the focus each time to keep it fresh.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();
      const insight =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Musical history in every note.";

      res.json({ insight });
    } catch (error) {
      console.error("Musical Insight Error:", error);
      res.json({ insight: "Distilled musical elegance." });
    }
  }
);

/* ── Helper: get current track duration from Firestore ──── */

async function getCurrentTrackDuration(
  trackIndex: number
): Promise<number | null> {
  const playlistSnap = await db
    .collection("playlists")
    .where("ownerId", "==", null)
    .limit(1)
    .get();
  if (playlistSnap.empty) return null;

  const trackIds: string[] = playlistSnap.docs[0].data().trackIds ?? [];
  if (trackIds.length === 0) return null;

  const idx = trackIndex % trackIds.length;
  const trackSnap = await db.collection("tracks").doc(trackIds[idx]).get();
  if (!trackSnap.exists) return null;

  return (trackSnap.data()!.durationSeconds as number) ?? null;
}

/**
 * Firestore trigger: when radioState/current is written,
 * schedule a Cloud Task to fire exactly when the current track ends.
 */
export const scheduleNextTrack = onDocumentWritten(
  "radioState/current",
  async (event) => {
    const data = event.data?.after?.data();
    if (!data) return;

    const { trackIndex, startedAtMillis } = data as {
      trackIndex: number;
      startedAtMillis: number;
    };

    const durationSec = await getCurrentTrackDuration(trackIndex);
    if (durationSec == null || durationSec <= 0) return;

    // How many seconds remain for this track?
    const elapsedSec = (Date.now() - startedAtMillis) / 1000;
    const remainingSec = Math.max(durationSec - elapsedSec, 0);

    // Enqueue a task to fire when the track ends.
    // Include startedAtMillis so the task can verify it's not stale
    // (e.g. a client already advanced the track before this task fires).
    const queue = getFunctions().taskQueue("advanceRadioTask");
    await queue.enqueue(
      { trackIndex, startedAtMillis },
      { scheduleDelaySeconds: Math.ceil(remainingSec) }
    );
  }
);

/**
 * Cloud Task handler: advances radio to the next track.
 * Fires exactly when the previous track should have ended.
 */
export const advanceRadioTask = onTaskDispatched(
  { retryConfig: { maxAttempts: 3 } },
  async (req) => {
    const { trackIndex: expectedIndex, startedAtMillis: expectedStarted } =
      req.data as { trackIndex: number; startedAtMillis: number };

    // Get playlist to determine next index
    const playlistSnap = await db
      .collection("playlists")
      .where("ownerId", "==", null)
      .limit(1)
      .get();
    if (playlistSnap.empty) return;

    const trackIds: string[] = playlistSnap.docs[0].data().trackIds ?? [];
    if (trackIds.length === 0) return;

    const nextIndex = (expectedIndex + 1) % trackIds.length;

    // Transaction: only advance if track AND startedAtMillis still match.
    // This ensures stale tasks (from a previous write) are no-ops.
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(db.doc("radioState/current"));
      if (!snap.exists) return;
      const current = snap.data()!;
      if (
        current.trackIndex !== expectedIndex ||
        current.startedAtMillis !== expectedStarted
      ) {
        return; // state has changed — this task is stale
      }
      tx.set(db.doc("radioState/current"), {
        trackIndex: nextIndex,
        startedAt: FieldValue.serverTimestamp(),
        startedAtMillis: Date.now(),
      });
    });
    // The Firestore write triggers scheduleNextTrack, chaining the next task.
  }
);
