import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect } from 'bun:test';
import { render } from '@testing-library/react';
import InstrumentPhotoUpload from './InstrumentPhotoUpload';

describe('InstrumentPhotoUpload', () => {
  test('renders upload button when under max photos', () => {
    const { getByText } = render(
      <InstrumentPhotoUpload instrumentId="test-id" existingPhotos={[]} onPhotosChange={() => {}} />
    );
    expect(getByText('Add photo (0/5)')).toBeTruthy();
  });

  test('shows correct photo count', () => {
    const photos = [1, 2, 3].map(i => `https://example.com/photo-${i}.jpg`);
    const { getByText } = render(
      <InstrumentPhotoUpload instrumentId="test-id" existingPhotos={photos} onPhotosChange={() => {}} />
    );
    expect(getByText('Add photo (3/5)')).toBeTruthy();
  });

  test('renders existing photo thumbnails', () => {
    const photos = ['https://example.com/a.jpg', 'https://example.com/b.jpg'];
    const { container } = render(
      <InstrumentPhotoUpload instrumentId="test-id" existingPhotos={photos} onPhotosChange={() => {}} />
    );
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(2);
  });
});
