import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect } from 'bun:test';
import { render } from '@testing-library/react';
import ProfileOwnerBar from './ProfileOwnerBar';

// ProfileOwnerBar depends on useAuth which depends on Supabase.
// Without a logged-in user, it renders null.
describe('ProfileOwnerBar', () => {
  test('renders nothing when no user is logged in', () => {
    const { container } = render(
      <ProfileOwnerBar profileUserId="some-user-id" />
    );
    expect(container.innerHTML).toBe('');
  });
});
