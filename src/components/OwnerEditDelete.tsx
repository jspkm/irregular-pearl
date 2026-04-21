// Unified pencil (edit) + × (delete) affordance for any item the current
// viewer owns: performer's notes, interpretive schools, signed piece
// descriptions, and any future signed content. Matches the movement header
// pattern for consistency — same icons, same hover-reveal, same inline
// "Delete? Yes / No" confirmation, same end-of-row placement.
//
// Placement: end of the byline / card row (per memory: edit affordance at
// end of target row). The parent renders this as the trailing element.

import { useState, useCallback } from 'react';

interface Props {
  itemLabel: string;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  busy?: boolean;
}

export default function OwnerEditDelete({ itemLabel, onEdit, onDelete, busy = false }: Props) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = useCallback(async () => {
    await onDelete();
    setConfirming(false);
  }, [onDelete]);

  return (
    <span className="owner-ctrls" aria-label={`Actions for ${itemLabel}`}>
      <button
        type="button"
        className="owner-ctrl"
        aria-label={`Edit ${itemLabel}`}
        onClick={onEdit}
        disabled={busy || confirming}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {confirming ? (
        <span className="owner-confirm" role="alertdialog">
          Delete?
          <button
            type="button"
            className="owner-confirm-yes"
            onClick={handleDelete}
            disabled={busy}
          >
            Yes
          </button>
          <button
            type="button"
            className="owner-confirm-no"
            onClick={() => setConfirming(false)}
            disabled={busy}
          >
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          className="owner-ctrl owner-ctrl-delete"
          aria-label={`Delete ${itemLabel}`}
          onClick={() => setConfirming(true)}
          disabled={busy}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
