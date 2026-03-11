import type { Timestamp } from "firebase/firestore";

export interface Track {
  id: string;
  title: string;
  composer: string;
  performers: string[];
  conductor?: string;
  venue?: string;
  datePerformed?: string;
  albumCover?: string;
  durationSeconds: number;
  epoch: string;
  source: string;
  audioUrl: string;
  license: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  ownerId: string | null;
  trackIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
