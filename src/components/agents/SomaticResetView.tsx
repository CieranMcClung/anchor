import { useEffect, useState } from 'react';
import { RESET_STEPS, SOMATIC_RESET_MINUTES } from '../../agents/somatic';
import { useClock } from '../../hooks/useClock';
import { formatDuration } from '../../utils/time';
import { ProgressRing } from '../ProgressRing';
import styles from './AgentBanner.module.css';
import ui from '../ui.module.css';

interface Props {
  onDone: () => void;
  onSkip: () => void;
}

export function SomaticResetView({ onDone, onSkip }: Props) {
  const [startedAt] = useState(() => Date.now());
  const endsAt = startedAt + SOMATIC_RESET_MINUTES * 60000;
  const now = useClock(250);
  const remaining = Math.max(0, endsAt - now.getTime());
  const progress = 1 - remaining / (SOMATIC_RESET_MINUTES * 60000);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (remaining <= 0 && !fired) {
      setFired(true);
      onDone();
    }
  }, [remaining, fired, onDone]);

  return (
    <div className={ui.screenFocus}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Somatic reset</h1>
          <p className={ui.subtitle}>Two minutes. Soft body, no performance.</p>
        </div>
        <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onSkip}>
          Skip
        </button>
      </header>

      <ProgressRing progress={Math.min(1, progress)}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '2.2rem',
            fontWeight: 700,
          }}
        >
          {formatDuration(remaining / 1000)}
        </p>
      </ProgressRing>

      <ol className={styles.resetList}>
        {RESET_STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={onDone}>
          That’s enough
        </button>
      </div>
    </div>
  );
}
