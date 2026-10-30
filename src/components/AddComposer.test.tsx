import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import AddComposer from './AddComposer';
import { hasSupabase } from '../lib/supabase';
afterEach(cleanup);
(hasSupabase ? test.skip : test)('composer form exposes required fields and disables offline saving', () => {
 const view = render(<AddComposer existingNames={[]} />);
 fireEvent.click(view.getByRole('button', {name:'+ Add composer'}));
 expect(document.activeElement).toBe(view.getByLabelText('Full name'));
 expect((view.getByLabelText('Full name') as HTMLInputElement).required).toBe(true);
 expect((view.getByLabelText('Official website or institutional profile') as HTMLInputElement).required).toBe(true);
 expect((view.getByLabelText('Notable composition (optional)') as HTMLInputElement).required).toBe(false);
 expect((view.getByRole('button',{name:'Add composer',exact:true}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(view.getByRole('button',{name:'Cancel'}));
 expect(view.queryByLabelText('Full name')).toBeNull();
});
