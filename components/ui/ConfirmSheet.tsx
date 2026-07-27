import { useEffect, useRef } from "react";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Bottom action sheet for destructive confirmation.
 *
 * Used only where the loss is real (a template is setup work). Cheap-to-recreate
 * rows keep instant swipe-delete — confirming everything trains people to
 * confirm without reading.
 */
export default function ConfirmSheet({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Focus moves into the dialog on open and back to the trigger on close —
    // an aria-modal that leaves focus in the background is modal in name only.
    restoreRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button");
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[70] flex items-end justify-center px-3 outline-none"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="animate-fade-in absolute inset-0 bg-black/30 backdrop-blur-[3px]" onClick={onCancel} />

      <div className="animate-fade-in relative w-full max-w-lg" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <div className="glass-elevated overflow-hidden rounded-[var(--radius-surface)]">
          <div className="px-5 pb-3 pt-4 text-center">
            <p className="text-[0.9375rem] font-semibold text-[color:var(--ink)]">{title}</p>
            {/* The consequence line is the one thing worth reading here — it
                gets body ink, not caption grey. */}
            {message && <p className="mt-1 text-[0.8125rem] leading-snug text-[color:var(--ink-secondary)]">{message}</p>}
          </div>
          <button
            onClick={onConfirm}
            className="pressable-subtle block w-full border-t-[0.5px] border-t-[rgba(60,60,67,0.12)] py-3.5 text-center text-[1.0625rem] font-semibold text-red-500 active:bg-red-500/10"
          >
            {confirmLabel}
          </button>
        </div>

        <button
          onClick={onCancel}
          className="glass-elevated pressable mt-2 block w-full rounded-[var(--radius-surface)] py-3.5 text-center text-[1.0625rem] font-semibold text-emerald-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
