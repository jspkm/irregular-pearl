#!/usr/bin/env bun
// Fills missing YouTube recording links in seed*.ts files using the YouTube Data API.
// Only touches pieces that have ZERO existing youtube links — preserves curated ones.
//
// Usage:
//   YOUTUBE_API_KEY=... bun run scripts/repopulate-recordings.ts            # all files
//   YOUTUBE_API_KEY=... bun run scripts/repopulate-recordings.ts <substr>   # filter by filename
//   YOUTUBE_API_KEY=... DRY_RUN=1 bun run scripts/repopulate-recordings.ts  # preview
//   YOUTUBE_API_KEY=... LIMIT=50 bun run scripts/repopulate-recordings.ts   # stop after N inserts
//
// Cost: 100 quota units per search.list call. Default daily quota is 10,000.
// With ~1700 pieces to fill, you'll need to either request a quota bump or run
// over multiple days. The script resumes automatically (skips pieces that have a
// youtube link from a prior run).

import { Glob } from 'bun';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { SeedPiece } from '../src/data/seed';

const ROOT = resolve(import.meta.dir, '..');
const YT_KEY = process.env.YOUTUBE_API_KEY;
const DRY = process.env.DRY_RUN === '1';
const LIMIT = parseInt(process.env.LIMIT || '0', 10);

if (!YT_KEY) {
  console.error('Missing YOUTUBE_API_KEY');
  process.exit(1);
}

type Hit = { videoId: string; title: string; channel: string };

async function ytSearch(query: string): Promise<Hit | null> {
  const u = new URL('https://www.googleapis.com/youtube/v3/search');
  u.searchParams.set('key', YT_KEY!);
  u.searchParams.set('part', 'snippet');
  u.searchParams.set('q', query);
  u.searchParams.set('type', 'video');
  u.searchParams.set('videoEmbeddable', 'true');
  u.searchParams.set('maxResults', '5');
  u.searchParams.set('safeSearch', 'none');
  const r = await fetch(u);
  if (!r.ok) {
    const body = await r.text();
    if (r.status === 403 && /quota/i.test(body)) {
      console.error('\nQUOTA EXCEEDED — stopping. Resume tomorrow.');
      process.exit(2);
    }
    console.error(`  search failed (${r.status}): ${body.slice(0, 200)}`);
    return null;
  }
  const j = (await r.json()) as {
    items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }[];
  };
  const item = j.items?.find((i) => i.id?.videoId);
  if (!item?.id?.videoId || !item.snippet) return null;
  return {
    videoId: item.id.videoId,
    title: item.snippet.title ?? '',
    channel: item.snippet.channelTitle ?? '',
  };
}

function scoreQueryForPiece(p: SeedPiece): string {
  // Composer name + piece title + catalog number disambiguates similar titles.
  const parts = [p.composer_name, p.title];
  if (p.catalog_number) parts.push(p.catalog_number);
  return parts.join(' ');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function insertYoutubeLink(src: string, pieceId: string, link: { url: string; label: string }): string | null {
  // Find the piece block: `id: '<pieceId>'` or `"id": "<pieceId>"`.
  const idRe = new RegExp(`["'\`]?id["'\`]?:\\s*['\"\`]${pieceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['\"\`]`);
  const m = idRe.exec(src);
  if (!m) return null;
  // From here, find `external_links` array opening `[`.
  const tail = src.slice(m.index);
  const extRe = /["'`]?external_links["'`]?:\s*\[/;
  const em = extRe.exec(tail);
  if (!em) return null;
  const openIdx = m.index + em.index + em[0].length;
  // Find matching `]` by bracket counting.
  let depth = 1;
  let i = openIdx;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) return null;
  // Insert before `]`. Detect element indent and whether the array is empty.
  const before = src.slice(openIdx, i);
  const arrayEmpty = !/[^\s]/.test(before);
  const elemIndentMatch = /\n([ \t]+)[\{"']/.exec(before);
  const elemIndent = elemIndentMatch ? elemIndentMatch[1] : '      ';
  const bracketIndent = elemIndent.replace(/[ \t]{2}$/, '');
  const labelEsc = decodeEntities(link.label).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // Detect per-entry style: single-line `{ ... }` vs multi-line.
  // Sniff the last preceding entry.
  const multiLine = /\{\s*\n\s*["']?type/.test(before);

  let entry: string;
  if (multiLine) {
    entry =
      `{\n` +
      `${elemIndent}  "type": "youtube",\n` +
      `${elemIndent}  "url": "${link.url}",\n` +
      `${elemIndent}  "label": "${labelEsc}"\n` +
      `${elemIndent}}`;
  } else {
    entry = `{ "type": "youtube", "url": "${link.url}", "label": "${labelEsc}" }`;
  }

  if (arrayEmpty) {
    const insertion = `\n${elemIndent}${entry}\n${bracketIndent}`;
    return src.slice(0, i) + insertion + src.slice(i);
  }

  // Trim trailing whitespace/newlines before `]` and ensure prev entry's `}` is followed by `,`.
  let j = i - 1;
  while (j > openIdx && /\s/.test(src[j])) j--;
  // j now points at a non-whitespace char (should be `}` or `,`).
  const prevChar = src[j];
  const cutAt = j + 1;
  const head = src.slice(0, cutAt);
  const rest = src.slice(i);
  const sep = prevChar === ',' ? '' : ',';
  return `${head}${sep}\n${elemIndent}${entry}\n${bracketIndent}${rest}`;
}

async function main() {
  const filter = process.argv.slice(2).find((a) => !a.startsWith('--'));
  const glob = new Glob('src/data/seed*.ts');
  const files: string[] = [];
  for await (const rel of glob.scan({ cwd: ROOT })) {
    if (rel.endsWith('.test.ts')) continue;
    if (filter && !rel.includes(filter)) continue;
    files.push(rel);
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const rel of files) {
    const abs = resolve(ROOT, rel);
    const mod = await import(abs);
    let src = await readFile(abs, 'utf8');
    let dirty = false;

    for (const exportName of Object.keys(mod)) {
      const val = mod[exportName];
      if (!Array.isArray(val)) continue;
      for (const piece of val as SeedPiece[]) {
        if (!piece || typeof piece !== 'object' || !('external_links' in piece)) continue;
        const hasYouTube = (piece.external_links ?? []).some((l) => l.type === 'youtube');
        if (hasYouTube) {
          skipped++;
          continue;
        }
        if (LIMIT && inserted >= LIMIT) {
          console.log(`\nLIMIT=${LIMIT} reached. Stopping.`);
          if (dirty && !DRY) await writeFile(abs, src);
          console.log(`Summary: +${inserted} inserted, ${skipped} skipped, ${failed} failed.`);
          return;
        }
        const q = scoreQueryForPiece(piece);
        if (DRY) {
          console.log(`  (dry) would search: ${piece.id}  ${q}`);
          inserted++;
          continue;
        }
        const hit = await ytSearch(q);
        if (!hit) {
          console.log(`  MISS  ${piece.id}  (${q})`);
          failed++;
          continue;
        }
        const url = `https://www.youtube.com/watch?v=${hit.videoId}`;
        const label = `${hit.channel} — ${hit.title}`.slice(0, 180);
        console.log(`  +  ${piece.id}  ${url}  (${label})`);
        if (!DRY) {
          const next = insertYoutubeLink(src, piece.id, { url, label });
          if (!next) {
            console.error(`    WARN: could not insert into ${rel} for ${piece.id}`);
            failed++;
            continue;
          }
          src = next;
          dirty = true;
        }
        inserted++;
      }
    }
    if (dirty && !DRY) await writeFile(abs, src);
  }

  console.log(`\nDone. +${inserted} inserted, ${skipped} skipped (already had youtube), ${failed} failed.`);
}

await main();
