import { t } from '../copy/t';
import type { FocusSession } from '../types';
import { formatMmSs } from '../utils/time';
import ui from './ui.module.css';
import styles from './SingleFocusHUD.module.css';

/** One card, one task. Timer is a soft buffer — hyperfocus is never force-cut. */

interface Props {
  session: FocusSession;
  elapsedMs: number;
  graceMs: number;
  restMode: boolean;
  unstickOpen: boolean;
  canSwap: boolean;
  onBegin: () => void;
  onPause: () => void;
  onDone: () => void;
  onNotThis: () => void;
  onSwap: () => void;
  onUnstick: () => void;
}

export function SingleFocusHUD({
  session,
  elapsedMs,
  graceMs,
  restMode,
  unstickOpen,
  canSwap,
  onBegin,
  onPause,
  onDone,
  onNotThis,
  onSwap,
  onUnstick,
}: Props) {
  const totalMs = session.bufferedMinutes * 60 * 1000;
  const remaining = totalMs - elapsedMs;
  const inGrace = remaining <= 0 && elapsedMs < totalMs + graceMs;
  const display = remaining > 0 ? formatMmSs(remaining) : '0:00';
  const running = session.runState === 'running';

  return (
    <div className={styles.wrap}>
      <article
        className={`${styles.card} ${unstickOpen ? styles.dimmed : ''}`}
        aria-label="Focus"
      >
        <p className={ui.label}>Focus</p>
        <h1 className={styles.title}>{session.title}</h1>
        <p className={styles.timer} aria-live="polite">
          {display}
          {inGrace ? <span className={ui.srOnly}> quiet extra minutes</span> : null}
        </p>
        {session.dod ? <p className={styles.dod}>{session.dod}</p> : null}

        {!restMode ? (
          <>
            {running ? (
              <button
                type="button"
                className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`}
                onClick={onPause}
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
                onClick={onBegin}
              >
                Begin
              </button>
            )}

            <button
              type="button"
              className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`}
              onClick={onDone}
            >
              {t('task.complete.title')}
            </button>

            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={onUnstick}
            >
              {t('unstick.button')}
            </button>

            <div className={ui.btnRow}>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={onNotThis}
              >
                {t('swap.notThis')}
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={onSwap}
                disabled={!canSwap}
              >
                {t('swap.button')}
              </button>
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}
