import { useEffect, useMemo, useState } from 'react';
import type { FocusSession } from '../types';
import { useAmbient } from '../hooks/useAmbient';
import { useClock } from '../hooks/useClock';
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
}

export function FocusView({
  session,
  ambientEnabled,
  onPark,
  onDone,
  onFinished,
  onOpenParking,
}: Props) {
  const now = useClock(250);
  const [finishedFired, setFinishedFired] = useState(false);

  useAmbient(session.bodyDouble && ambientEnabled);

  const totalMs = session.durationMinutes * 60000;
  const elapsed = Math.min(totalMs, now.getTime() - session.startedAt);
  const remainingMs = Math.max(0, session.endsAt - now.getTime());
  const progress = Math.min(1, elapsed / totalMs);

  const endLabel = useMemo(
    () => formatWallClock(new Date(session.endsAt)),
    [session.endsAt]
  );

  useEffect(() => {
    if (remainingMs <= 0 && !finishedFired) {
      setFinishedFired(true);
      onFinished();
    }
  }, [remainingMs, finishedFired, onFinished]);

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

      <ProgressRing progress={progress}>
        <p className={styles.timeBig}>{formatDuration(remainingMs / 1000)}</p>
        <p className={styles.meta}>remaining</p>
      </ProgressRing>

      <p className={styles.meta} style={{ textAlign: 'center', marginTop: '0.85rem' }}>
        Elapsed {formatDuration(elapsed / 1000)} · ends {endLabel}
      </p>

      {session.bodyDouble && (
        <p className={styles.presence}>
          Quiet presence on
          {ambientEnabled ? ' · soft sound' : ' · sound off'}
        </p>
      )}

      <div className={styles.footer}>
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
