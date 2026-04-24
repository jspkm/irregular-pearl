import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  onUndo: () => void;
  duration?: number;
  onDismiss: () => void;
}

export default function Toast({ message, onUndo, duration = 5000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-ink text-bg px-4 py-2.5 rounded-lg text-sm shadow-lg">
      <span className="text-success font-semibold">✓</span>
      <span>{message}</span>
      <button
        onClick={() => {
          onUndo();
          setVisible(false);
          onDismiss();
        }}
        className="text-warning font-semibold underline underline-offset-2 bg-transparent border-none cursor-pointer ml-1 p-0 text-sm"
      >
        Undo
      </button>
    </div>
  );
}
