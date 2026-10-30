import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import EraKnowledge from './EraKnowledge';
import { hasSupabase } from '../lib/supabase';
const offlineTest = hasSupabase ? test.skip : test;
afterEach(cleanup);
offlineTest('characteristic form preserves the reference list and cannot pretend to save offline', () => {
  const view = render(<EraKnowledge eraId="13th-century" kind="characteristic" entries={[{ name: 'Measured polyphony', description: '' }]} />);
  fireEvent.click(view.getByRole('button', { name: '+ Add characteristic' }));
  expect(view.getByText('Measured polyphony')).toBeTruthy();
  expect(document.activeElement).toBe(view.getByLabelText('Characteristic'));
  expect(view.queryByLabelText('Explanation')).toBeNull();
  expect((view.getByRole('button', { name: 'Sign in to add characteristic' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
  expect(view.queryByLabelText('Characteristic')).toBeNull();
  expect(document.activeElement).toBe(view.getByRole('button', { name: '+ Add characteristic' }));
});
offlineTest('concept form requires both fields and is independent from the characteristic form', () => {
  const view = render(<><EraKnowledge eraId="13th-century" kind="characteristic" entries={[]} /><EraKnowledge eraId="13th-century" kind="theory" entries={[{ name: 'Rhythmic modes', description: 'Patterns of duration.' }]} /></>);
  fireEvent.click(view.getByRole('button', { name: '+ Add concept' }));
  expect((view.getByLabelText('Concept') as HTMLInputElement).required).toBe(true);
  expect((view.getByLabelText('Explanation') as HTMLTextAreaElement).required).toBe(true);
  expect(view.queryByLabelText('Characteristic')).toBeNull();
  expect(view.getByText('Patterns of duration.')).toBeTruthy();
});
