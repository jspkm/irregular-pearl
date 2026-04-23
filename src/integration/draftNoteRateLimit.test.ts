// log_draft_note_request — auth + staff gate + 24h rate limit.

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { admin, createAuthUser, deleteAuthUser } from './helpers';

describe('log_draft_note_request', () => {
  let staff: Awaited<ReturnType<typeof createAuthUser>>;
  let plain: Awaited<ReturnType<typeof createAuthUser>>;

  beforeAll(async () => {
    staff = await createAuthUser({ displayName: 'Draft Note Staff', isStaff: true });
    plain = await createAuthUser({ displayName: 'Draft Note Plain' });
    // Small cap for the test so we don't have to fire 20 calls.
    await admin.from('app_config').upsert({ key: 'draft_note.per_user_per_24h', value: 3 });
  });

  afterAll(async () => {
    await admin.from('draft_note_requests').delete().in('user_id', [staff.id, plain.id]);
    await admin.from('app_config').upsert({ key: 'draft_note.per_user_per_24h', value: 20 });
    await deleteAuthUser(staff.id);
    await deleteAuthUser(plain.id);
  });

  test('anonymous caller rejected', async () => {
    const { error } = await admin.rpc('log_draft_note_request');
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unauthenticated/i);
  });

  test('non-staff caller rejected', async () => {
    const { error } = await plain.client.rpc('log_draft_note_request');
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/staff only/i);

    // And didn't log a row.
    const { data } = await admin
      .from('draft_note_requests')
      .select('user_id')
      .eq('user_id', plain.id);
    expect(data!.length).toBe(0);
  });

  test('staff caller logs, then blocks at cap', async () => {
    for (let i = 0; i < 3; i++) {
      const { error } = await staff.client.rpc('log_draft_note_request');
      expect(error).toBeNull();
    }
    const { error: over } = await staff.client.rpc('log_draft_note_request');
    expect(over).not.toBeNull();
    expect(over!.message).toMatch(/rate_limit/i);

    const { data } = await admin
      .from('draft_note_requests')
      .select('user_id')
      .eq('user_id', staff.id);
    expect(data!.length).toBe(3);
  });
});
