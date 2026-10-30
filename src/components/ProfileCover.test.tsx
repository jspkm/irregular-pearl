import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import ProfileCover from './ProfileCover';
afterEach(cleanup);
test('rejects unsupported cover files and keeps the empty cover', () => {
 const view = render(<ProfileCover />);
 fireEvent.change(view.getByLabelText('Choose cover photo'), {target:{files:[new File(['text'], 'notes.txt', {type:'text/plain'})]}});
 expect(view.getByRole('alert').textContent).toContain('JPG, PNG, or WebP');
 expect(view.getByText('Make this space yours')).toBeTruthy();
});
test('rejects oversized photos before creating a preview', () => {
 const view = render(<ProfileCover />);
 const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'cover.png', {type:'image/png'});
 fireEvent.change(view.getByLabelText('Choose cover photo'), {target:{files:[file]}});
 expect(view.getByRole('alert').textContent).toContain('10 MB');
});
