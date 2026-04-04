import { useState } from 'react';

/**
 * Inline confirmation + optional text input.
 * Replaces native confirm(), alert(), and prompt() dialogs.
 *
 * Usage:
 *   <InlineConfirm
 *     message="Delete this post? This cannot be undone."
 *     confirmLabel="Delete"
 *     confirmStyle="danger"
 *     onConfirm={() => handleDelete()}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 *
 *   <InlineConfirm
 *     message="Reason for rejection:"
 *     confirmLabel="Reject"
 *     confirmStyle="danger"
 *     inputPlaceholder="Optional note..."
 *     onConfirm={(note) => handleReject(note)}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */

interface Props {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmStyle?: 'danger' | 'success' | 'default';
  inputPlaceholder?: string; // if set, shows a text input (replaces prompt())
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
}

const STYLES = {
  danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
  success: 'bg-[#15803D] hover:bg-[#166534] text-white',
  default: 'bg-[#1C1917] hover:bg-[#292524] text-white',
};

export default function InlineConfirm({
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmStyle = 'default',
  inputPlaceholder,
  onConfirm,
  onCancel,
}: Props) {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="bg-[#FAF8F5] border border-[#E7E5E4] rounded-lg p-3 mt-2">
      <p className="text-xs text-[#1C1917] mb-2">{message}</p>
      {inputPlaceholder && (
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={inputPlaceholder}
          className="w-full px-2.5 py-1.5 border border-[#E7E5E4] rounded text-xs mb-2 focus:outline-none focus:border-[#B45309] font-sans bg-white"
          autoFocus
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(inputPlaceholder ? inputValue : undefined)}
          className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer border-none ${STYLES[confirmStyle]}`}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs text-[#78716C] hover:text-[#1C1917] bg-transparent border-none cursor-pointer transition-colors"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * Inline error/success message (replaces alert()).
 * Auto-dismisses after 4 seconds.
 */
export function InlineMessage({
  message,
  type = 'error',
  onDismiss,
}: {
  message: string;
  type?: 'error' | 'success';
  onDismiss: () => void;
}) {
  const colors = type === 'error'
    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
    : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]';

  setTimeout(onDismiss, 4000);

  return (
    <div className={`px-3 py-2 rounded-lg text-xs border mt-2 flex items-center justify-between ${colors}`}>
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 text-current opacity-50 hover:opacity-100 bg-transparent border-none cursor-pointer text-xs">
        &times;
      </button>
    </div>
  );
}
