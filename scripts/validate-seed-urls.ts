#!/usr/bin/env bun
// Validates every external_links[].url across all seed*.ts files.
// Exits 1 if any URL is dead or points to a missing/unavailable resource.
//
// Usage:
//   bun run scripts/validate-seed-urls.ts              # validate all
//   bun run scripts/validate-seed-urls.ts <substr>     # validate matching files only
//   bun run scripts/validate-seed-urls.ts --fix        # remove dead links from seed files
//   bun run scripts/validate-seed-urls.ts --fix <sub>  # fix matching files only

import { Glob } from 'bun';
import { resolve } from 'node:path';
import type { SeedPiece } from '../src/data/seed';

const ROOT = resolve(import.meta.dir, '..');
const CONCURRENCY = 12;
const TIMEOUT_MS = 15_000;

type Link = SeedPiece['external_links'][number];
type Entry = { file: string; pieceId: string; link: Link };

async function loadAllPieces(filter?: string): Promise<Entry[]> {
  const glob = new Glob('src/data/seed*.ts');
  const entries: Entry[] = [];
  for await (const rel of glob.scan({ cwd: ROOT })) {
    if (rel.endsWith('.test.ts')) continue;
    if (filter && !rel.includes(filter)) continue;
    const mod = await import(resolve(ROOT, rel));
    for (const exportName of Object.keys(mod)) {
      const val = mod[exportName];
      if (!Array.isArray(val)) continue;
      for (const piece of val as SeedPiece[]) {
        if (!piece || typeof piece !== 'object' || !('external_links' in piece)) continue;
        for (const link of piece.external_links ?? []) {
          entries.push({ file: rel, pieceId: piece.id, link });
        }
      }
    }
  }
  return entries;
}

type Result = { ok: true } | { ok: false; reason: string };

async function check(link: Link): Promise<Result> {
  const ctrl = AbortSignal.timeout(TIMEOUT_MS);
  try {
    // YouTube needs body inspection — HEAD always returns 200 even for removed videos.
    if (link.type === 'youtube') {
      const url = new URL(link.url);
      const id = url.searchParams.get('v') ?? url.pathname.split('/').pop();
      if (!id || id.length < 8) return { ok: false, reason: 'no video id' };
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(link.url)}&format=json`, { signal: ctrl });
      if (r.status === 401 || r.status === 404) return { ok: false, reason: `oembed ${r.status} (video unavailable)` };
      if (!r.ok) return { ok: false, reason: `oembed ${r.status}` };
      return { ok: true };
    }

    // Spotify: oembed returns 404 for missing tracks/albums.
    if (link.type === 'spotify') {
      const r = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(link.url)}`, { signal: ctrl });
      if (!r.ok) return { ok: false, reason: `spotify oembed ${r.status}` };
      return { ok: true };
    }

    // Vimeo: oembed returns 403/404 for missing.
    if (link.type === 'vimeo') {
      const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(link.url)}`, { signal: ctrl });
      if (!r.ok) return { ok: false, reason: `vimeo oembed ${r.status}` };
      return { ok: true };
    }

    // Default: GET with redirect follow. HEAD is unreliable on archive.org/IMSLP.
    const r = await fetch(link.url, { signal: ctrl, redirect: 'follow', headers: { 'user-agent': 'irregular-pearl-link-validator/1.0' } });
    if (!r.ok) return { ok: false, reason: `http ${r.status}` };

    // archive.org returns 200 with a "not available" page for deleted items.
    if (link.type === 'internet_archive') {
      const text = await r.text();
      if (/item is no longer available|cannot find the item/i.test(text)) {
        return { ok: false, reason: 'archive.org: item no longer available' };
      }
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg };
  }
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= items.length) return;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const filter = args.find((a) => !a.startsWith('--'));
const entries = await loadAllPieces(filter);
console.log(`Validating ${entries.length} URLs across seed files...`);

let done = 0;
const results = await pool(entries, CONCURRENCY, async (e) => {
  const r = await check(e.link);
  done++;
  if (done % 50 === 0) process.stderr.write(`  ${done}/${entries.length}\n`);
  return { entry: e, result: r };
});

const failures = results.filter((r) => !r.result.ok);
if (failures.length === 0) {
  console.log(`OK — all ${entries.length} URLs reachable.`);
  process.exit(0);
}

console.error(`\nFAIL — ${failures.length}/${entries.length} dead URLs:\n`);
const byFile = new Map<string, typeof failures>();
for (const f of failures) {
  const list = byFile.get(f.entry.file) ?? [];
  list.push(f);
  byFile.set(f.entry.file, list);
}
for (const [file, list] of byFile) {
  console.error(`  ${file}  (${list.length})`);
  for (const f of list) {
    const reason = f.result.ok ? '' : f.result.reason;
    console.error(`    [${f.entry.pieceId}] ${f.entry.link.type}: ${f.entry.link.url}`);
    console.error(`      → ${reason}`);
  }
}

if (fix) {
  const { readFile, writeFile } = await import('node:fs/promises');
  console.error(`\n--fix: removing dead links from ${byFile.size} files...`);
  let removed = 0;
  for (const [file, list] of byFile) {
    const abs = resolve(ROOT, file);
    let src = await readFile(abs, 'utf8');
    for (const f of list) {
      const u = f.entry.link.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Single-line: { type: 'x', url: '<url>', label: '...' },
      const singleRe = new RegExp(`^[ \\t]*\\{[^\\n]*["'\`]?url["'\`]?:\\s*['\"\`]${u}['\"\`][^\\n]*\\},?\\s*\\n`, 'm');
      let next = src.replace(singleRe, '');
      if (next === src) {
        // Multi-line: find the url line, walk backward to `{`, forward to matching `},` or `}`.
        const urlLineRe = new RegExp(`^[ \\t]*["'\`]?url["'\`]?:\\s*['\"\`]${u}['\"\`],?\\s*$`, 'm');
        const m = urlLineRe.exec(src);
        if (m) {
          // Walk back to opening `{` on its own line (possibly `      {`)
          let start = src.lastIndexOf('{', m.index);
          // back up to start-of-line
          while (start > 0 && src[start - 1] !== '\n') start--;
          // Walk forward to matching `}` by brace counting from the `{`.
          let depth = 0;
          let i = src.indexOf('{', m.index === start ? start : start);
          // find the opening brace position
          let openIdx = src.indexOf('{', start);
          i = openIdx;
          for (; i < src.length; i++) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') {
              depth--;
              if (depth === 0) { i++; break; }
            }
          }
          // consume trailing `,` and newline
          if (src[i] === ',') i++;
          while (src[i] === ' ' || src[i] === '\t') i++;
          if (src[i] === '\n') i++;
          next = src.slice(0, start) + src.slice(i);
        }
      }
      if (next !== src) {
        removed++;
        src = next;
      } else {
        console.error(`  WARN: could not match entry for ${f.entry.link.url} in ${file}`);
      }
    }
    await writeFile(abs, src);
    console.error(`  ${file}: rewrote`);
  }
  console.error(`\nRemoved ${removed}/${failures.length} dead link entries. Re-run without --fix to verify.`);
  process.exit(0);
}
process.exit(1);
