import { t, type StringKey } from '../copy/t';
import ui from './ui.module.css';

const STEPS: StringKey[] = [
  'unstick.step.openApp',
  'unstick.step.oneBreath',
  'unstick.step.standUp',
];

interface Props {
  open: boolean;
  onPick: (label: string) => void;
  onDismiss: () => void;
}

export function UnstickSheet({ open, onPick, onDismiss }: Props) {
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        className={ui.sheetBackdrop}
        aria-label="Dismiss Un-Stick"
        onClick={onDismiss}
      />
      <div className={ui.sheet} role="dialog" aria-labelledby="unstick-title">
        <div className={ui.sheetHandle} />
        <p id="unstick-title" className={ui.label}>
          {t('unstick.prompt')}
        </p>
        <div className={ui.block} style={{ marginTop: 16 }}>
          {STEPS.map((key) => (
            <button
              key={key}
              type="button"
              className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`}
              onClick={() => onPick(t(key))}
            >
              {t(key)}
            </button>
          ))}
          <button
            type="button"
            className={`${ui.btn} ${ui.btnMuted}`}
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
}
