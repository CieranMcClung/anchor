import ui from './ui.module.css';
import type { ToastState } from '../hooks/useAnchorApp';

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div className={ui.toast} role="status">
      <div>
        <strong>{toast.title}</strong>
        {toast.body ? <div className={ui.meta}>{toast.body}</div> : null}
      </div>
      {toast.onUndo ? (
        <button
          type="button"
          className={`${ui.btn} ${ui.btnGhost}`}
          onClick={toast.onUndo}
        >
          {toast.undoLabel ?? 'Undo'}
        </button>
      ) : null}
    </div>
  );
}
