import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, describe, test, expect } from 'bun:test';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import RequestContributionDialog from './RequestContributionDialog';

// Regression pin for the sign-in modal drift bug (sibling to
// StartContributionButton.test.tsx). Anon click on the request trigger must
// open the SignInPanel inline, not navigate to /?sign_in=1 (the old typo'd
// param that dropped users on the home page with no dialog).
describe('RequestContributionDialog (anon)', () => {
  afterEach(() => cleanup());

  test('click on anon trigger opens the SignInPanel modal inline', async () => {
    const { container, getByText } = render(
      <RequestContributionDialog
        pieceId="test-piece"
        pieceTitle="Test Piece"
        composerName="Test Composer"
        triggerLabel="Request a contribution"
      />,
    );

    await waitFor(() => {
      expect(getByText('Request a contribution')).toBeTruthy();
    });

    expect(container.querySelector('.ip-signin-modal')).toBeNull();

    fireEvent.click(getByText('Request a contribution'));

    const modal = container.querySelector('.ip-signin-modal');
    expect(modal).not.toBeNull();
    const title = container.querySelector('.ip-signin-title');
    expect(title?.textContent).toContain('Sign in');
  });
});
