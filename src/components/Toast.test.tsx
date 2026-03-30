import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { describe, test, expect, mock } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  test('renders message', () => {
    const { getByText } = render(
      <Toast message="Logged: Practiced" onUndo={() => {}} onDismiss={() => {}} />
    );
    expect(getByText('Logged: Practiced')).toBeTruthy();
  });

  test('renders checkmark', () => {
    const { getByText } = render(
      <Toast message="Test" onUndo={() => {}} onDismiss={() => {}} />
    );
    expect(getByText('✓')).toBeTruthy();
  });

  test('renders undo button', () => {
    const { getByText } = render(
      <Toast message="Test" onUndo={() => {}} onDismiss={() => {}} />
    );
    expect(getByText('Undo')).toBeTruthy();
  });

  test('clicking undo calls onUndo and onDismiss', () => {
    const onUndo = mock(() => {});
    const onDismiss = mock(() => {});
    const { getByText } = render(
      <Toast message="Test" onUndo={onUndo} onDismiss={onDismiss} />
    );
    fireEvent.click(getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('auto-dismisses after duration', async () => {
    const onDismiss = mock(() => {});
    render(
      <Toast message="Test" onUndo={() => {}} onDismiss={onDismiss} duration={50} />
    );
    await new Promise(r => setTimeout(r, 100));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
