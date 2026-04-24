import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, describe, test, expect } from 'bun:test';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import StartContributionButton from './StartContributionButton';

// Regression pin for the sign-in modal drift bug: anon click on the CTA used
// to navigate to /?sign_in=1 (typo'd param). The home page's AuthButton
// listens for ?signin=1, so the modal never opened and the user landed on
// the main page with no dialog. Fix routed the click to open SignInPanel
// inline on the current page. This test asserts that contract.
describe('StartContributionButton (anon)', () => {
  afterEach(() => cleanup());

  test('click opens the SignInPanel modal inline (no navigation)', async () => {
    const { container, getByText } = render(
      <StartContributionButton pieceId="test-piece" />,
    );

    // Wait for useAuth to finish resolving (loading=false, user=null).
    await waitFor(() => {
      expect(getByText('Start the first contribution')).toBeTruthy();
    });

    // No modal before click.
    expect(container.querySelector('.ip-signin-modal')).toBeNull();

    fireEvent.click(getByText('Start the first contribution'));

    // Modal is now rendered inline on this component.
    const modal = container.querySelector('.ip-signin-modal');
    expect(modal).not.toBeNull();
    const title = container.querySelector('.ip-signin-title');
    expect(title?.textContent).toContain('Sign in');
  });
});
