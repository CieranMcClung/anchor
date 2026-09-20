import { useEffect, useMemo, useState } from 'react';
import type { FocusSession } from '../types';
import { useAmbient } from '../hooks/useAmbient';
import { useClock } from '../hooks/useClock';
import { paralyzedMicroStep } from '../utils/microStart';
import { formatDuration, formatWallClock } from '../utils/time';
import { ProgressRing } from './ProgressRing';
import styles from './FocusView.module.css';
import ui from './ui.module.css';

interface Props {
  session: FocusSession;
  ambientEnabled: boolean;
  onPark: () => void;
  onDone: () => void;
  onFinished: () => void;
  onOpenParking: () => void;
  /** Replace step with a 2-min micro and restart timer. */
  onParalyzed: (microStep: string) => void;
  onToggleBodyDouble?: () => void;
}

const STUCK_AFTER_MS = 3 * 60 * 1000; // offer initiation helper after ~3 min idle-feeling

export function FocusView({
  session,
  ambientEnabled,
  onPark,
  onDone,
  onFinished,
  onOpenParking,
  onParalyzed,
  onToggleBodyDouble,
}: Props) {
  const now = useClock(250);
  const [finishedFired, setFinishedFired] = useState(false);
  const [dismissedHelper, setDismissedHelper] = useState(false);

  useAmbient(session.bodyDouble && ambientEnabled);

  const totalMs = session.durationMinutes * 60000;
  const elapsed = Math.min(totalMs, now.getTime() - session.startedAt);
  const remainingMs = Math.max(0, session.endsAt - now.getTime());
  const progress = Math.min(1, elapsed / totalMs);

  const endLabel = useMemo(
    () => formatWallClock(new Date(session.endsAt)),
    [session.endsAt]
  );

  const showInitiationHelper =
    !dismissedHelper &&
    !session.isMicro &&
    elapsed >= STUCK_AFTER_MS &&
    remainingMs > 0;

  useEffect(() => {
    if (remainingMs <= 0 && !finishedFired) {
      setFinishedFired(true);
      onFinished();
    }
  }, [remainingMs, finishedFired, onFinished]);

  const handleParalyzed = () => {
    const micro = paralyzedMicroStep(session.task, session.definitionOfDone);
    onParalyzed(micro);
  };

  return (
    <div className={ui.screenFocus}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Focus</h1>
          <p className={ui.subtitle}>Only this step. Nothing else.</p>
        </div>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnGhost}`}
          onClick={onOpenParking}
        >
          Park something
        </button>
      </header>

      <p className={styles.task}>{session.task}</p>
      <p className={styles.micro}>{session.microStep}</p>

      {session.definitionOfDone && (
        <p className={styles.dod}>
          Done when: {session.definitionOfDone}
        </p>
      )}

      <ProgressRing progress={progress}>
        <p className={styles.timeBig}>{formatDuration(remainingMs / 1000)}</p>
        <p className={styles.meta}>remaining</p>
      </ProgressRing>

      <p className={styles.meta} style={{ textAlign: 'center', marginTop: '0.85rem' }}>
        Elapsed {formatDuration(elapsed / 1000)} · ends {endLabel}
        {session.estimateMinutes !== session.durationMinutes && (
          <>
            <br />
            Estimate {session.estimateMinutes} min · buffered{' '}
            {session.durationMinutes} min (+40%)
          </>
        )}
      </p>

      {session.bodyDouble && (
        <p className={styles.presence}>
          Quiet presence on
          {ambientEnabled ? ' · soft sound' : ' · sound off'}
        </p>
      )}

      {showInitiationHelper && (
        <div className={styles.helper}>
          <p className={styles.helperTitle}>Still finding the start?</p>
          <p className={styles.helperText}>
            No shame — shrink it to two minutes, or keep quiet company.
          </p>
          <div className={styles.helperActions}>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnPrimary}`}
              onClick={handleParalyzed}
            >
              2-min micro-step
            </button>
            {onToggleBodyDouble && !session.bodyDouble && (
              <button
                type="button"
                className={`${ui.btn} ${ui.btnSecondary}`}
                onClick={onToggleBodyDouble}
              >
                Quiet body-double
              </button>
            )}
            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={() => setDismissedHelper(true)}
            >
              I’m okay
            </button>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnSecondary} ${styles.stuck}`}
          onClick={handleParalyzed}
        >
          Paralyzed / Stuck
        </button>
        <p className={ui.hint} style={{ textAlign: 'center', margin: 0 }}>
          Swaps in a 2-minute micro-step — no guilt.
        </p>
        <div className={styles.sideActions}>
          <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onPark}>
            Park it
          </button>
          <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
