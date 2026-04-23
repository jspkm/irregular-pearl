// piece_redirects resolver — identity-immutability invariant test.
// The pieces.id column is never UPDATEd in place; slug corrections go
// through this table. A request for an old slug resolves to the current
// canonical piece_id.

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { admin, createTestPiece, deleteTestPiece } from './helpers';
import { resolvePieceRedirect } from '../lib/pieceRedirects';

describe('resolvePieceRedirect', () => {
  const TARGET_PIECE = 'test-redirect-target';
  const OLD_SLUG = 'test-redirect-old-slug';
  const DIFFERENT_SLUG = 'test-redirect-stranger-slug';

  beforeAll(async () => {
    await createTestPiece(TARGET_PIECE, 'Redirect Target Piece');
    await admin.from('piece_redirects').insert({
      from_slug: OLD_SLUG,
      to_piece_id: TARGET_PIECE,
    });
  });

  afterAll(async () => {
    await admin.from('piece_redirects').delete().eq('from_slug', OLD_SLUG);
    await deleteTestPiece(TARGET_PIECE);
  });

  test('returns the target piece_id for a known redirect', async () => {
    expect(await resolvePieceRedirect(OLD_SLUG)).toBe(TARGET_PIECE);
  });

  test('returns null for an unknown slug', async () => {
    expect(await resolvePieceRedirect(DIFFERENT_SLUG)).toBeNull();
  });

  test('returns null for an empty slug', async () => {
    expect(await resolvePieceRedirect('')).toBeNull();
  });

  test('target piece deletion cascades (ON DELETE CASCADE)', async () => {
    // Create a second redirect + piece pair so we can delete just this one
    const P = 'test-redirect-cascade-target';
    const OLD = 'test-redirect-cascade-old';
    await createTestPiece(P, 'Cascade Target');
    await admin.from('piece_redirects').insert({ from_slug: OLD, to_piece_id: P });

    expect(await resolvePieceRedirect(OLD)).toBe(P);

    await deleteTestPiece(P);

    // ON DELETE CASCADE on piece_redirects.to_piece_id → redirect gone
    expect(await resolvePieceRedirect(OLD)).toBeNull();
  });
});
