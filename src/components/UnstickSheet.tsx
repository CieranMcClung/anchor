import { t, type StringKey } from '../copy/t';
import type { UnstickDepth } from '../types';
import ui from './ui.module.css';

const STANDARD_STEPS: StringKey[] = [
  'unstick.step.openApp',
  'unstick.step.oneBreath',
  'unstick.step.standUp',
];

const DEEPER_STEPS: StringKey[] = [
  'unstick.deeper.look',
  'unstick.deeper.closer',
  'unstick.deeper.touch',
  'unstick.deeper.mark',
  'unstick.deeper.water',
];

interface Props {
  open: boolean;
  depth?: UnstickDepth;
  onPick: (label: string) => void;
  onDismiss: () => void;
}

export function UnstickSheet({
  open,
  depth = 'standard',
  onPick,
  onDismiss,
}: Props) {
  if (!open) return null;
  const steps = depth === 'deeper' ? DEEPER_STEPS : STANDARD_STEPS;
  const titleKey: StringKey =
    depth === 'deeper' ? 'unstick.deeper.prompt' : 'unstick.prompt';
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
          {t(titleKey)}
        </p>
        {depth === 'deeper' ? (
          <p className={ui.cue} style={{ marginBottom: 0 }}>
            {t('hud.tooHard.hint')}
          </p>
        ) : null}
        <div className={ui.block} style={{ marginTop: 16 }}>
          {steps.map((key) => (
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
