import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, describe, test, expect } from 'bun:test';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import SignedPieceDifficulty from './SignedPieceDifficulty';
import type { PieceDifficultyAxes } from '../data/difficulty-axes';

// Regression pin for the sign-in panel drift bug. This component renders the
// SignInPanel from two branches: the empty-state early return (no seed, no
// ratings) and the main stack view. The two blocks were copy-pasted, then only
// the early-return copy was converted to useRequireAuth — the main-view copy
// kept calling a `setSignInOpen` that no longer existed, so closing the panel
// threw ReferenceError and post-sign-in resume never fired. Both branches now
// route through one renderSignInPanel() helper; these tests cover both so the
// copies can't drift apart again.
const seedAxes: PieceDifficultyAxes = {
  technical: { level: 4, label: 'Advanced', note: 'Thumb position throughout.' },
  stamina: { level: 3, label: 'Intermediate', note: 'Sustained but sectional.' },
  interpretive: { level: 5, label: 'Very advanced', note: 'Rhetorical freedom.' },
  ensemble: { level: 1, label: 'n/a', note: 'Solo work.' },
};

describe('SignedPieceDifficulty (anon) sign-in panel', () => {
  afterEach(() => cleanup());

  test('main stack view: panel opens on gate and closes without throwing', async () => {
    const { container, getByRole, findByText } = render(
      <SignedPieceDifficulty
        pieceId="test-piece"
        initialRatings={[]}
        seedAxes={seedAxes}
        seedDifficultyVoteId={null}
      />,
    );

    // Seed axes present => main stack view, not the empty-state early return.
    const entry = await findByText(/Add your own difficulty rating/);
    expect(container.querySelector('.ip-signin-modal')).toBeNull();

    fireEvent.click(entry);
    expect(container.querySelector('.ip-signin-modal')).not.toBeNull();

    // The bug: this click called an undefined setSignInOpen and threw.
    fireEvent.click(getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(container.querySelector('.ip-signin-modal')).toBeNull();
    });
  });

  test('empty-state view: panel opens on gate and closes without throwing', async () => {
    const { container, getByRole, findByText } = render(
      <SignedPieceDifficulty
        pieceId="test-piece"
        initialRatings={[]}
        seedAxes={null}
        seedDifficultyVoteId={null}
      />,
    );

    const entry = await findByText(/Add your own difficulty rating/);
    fireEvent.click(entry);
    expect(container.querySelector('.ip-signin-modal')).not.toBeNull();

    fireEvent.click(getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(container.querySelector('.ip-signin-modal')).toBeNull();
    });
  });
});
