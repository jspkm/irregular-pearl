import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Track, Playlist, UserProfile } from "./types";

/* ── Tracks ─────────────────────────────────────────── */

export async function getAllTracks(): Promise<Track[]> {
  const snap = await getDocs(collection(db, "tracks"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Track);
}

export async function getTracksByIds(ids: string[]): Promise<Track[]> {
  if (ids.length === 0) return [];
  // Firestore limits `in` queries to 30 items. Batch if needed.
  const tracks: Track[] = [];
  for (let i = 0; i < ids.length; i += 30) {
    const batch = ids.slice(i, i + 30);
    const q = query(collection(db, "tracks"), where("__name__", "in", batch));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => tracks.push({ id: d.id, ...d.data() } as Track));
  }
  // Preserve original order
  const orderMap = new Map(ids.map((id, idx) => [id, idx]));
  tracks.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  return tracks;
}

/* ── Playlists ──────────────────────────────────────── */

export async function getMasterPlaylist(): Promise<Playlist | null> {
  const q = query(
    collection(db, "playlists"),
    where("ownerId", "==", null)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Playlist;
}

export async function getUserPlaylists(uid: string): Promise<Playlist[]> {
  const q = query(
    collection(db, "playlists"),
    where("ownerId", "==", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Playlist);
}

export async function createPlaylist(
  uid: string,
  name: string,
  trackIds: string[] = []
): Promise<string> {
  const ref = await addDoc(collection(db, "playlists"), {
    name,
    ownerId: uid,
    trackIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlaylistTracks(
  playlistId: string,
  trackIds: string[]
): Promise<void> {
  await updateDoc(doc(db, "playlists", playlistId), {
    trackIds,
    updatedAt: serverTimestamp(),
  });
}

export async function renamePlaylist(
  playlistId: string,
  name: string
): Promise<void> {
  await updateDoc(doc(db, "playlists", playlistId), {
    name,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await deleteDoc(doc(db, "playlists", playlistId));
}

export async function getPlaylistById(playlistId: string): Promise<Playlist | null> {
  const d = await getDoc(doc(db, "playlists", playlistId));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Playlist;
}

/* ── User Profiles ─────────────────────────────────── */

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const d = await getDoc(doc(db, "userProfiles", uid));
  if (!d.exists()) return null;
  return d.data() as UserProfile;
}

export async function setUserProfile(
  uid: string,
  data: { displayName?: string; photoURL?: string }
): Promise<void> {
  const { setDoc } = await import("firebase/firestore");
  await setDoc(
    doc(db, "userProfiles", uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
