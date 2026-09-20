import { t } from '../copy/t';
import type { FocusSession } from '../types';
import { shouldShowHyperfocus } from '../utils/duration';
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
  hyperfocusMinutes: number;
  previewHyperfocus?: boolean;
  bufferPercent: number;
  onBegin: () => void;
  onPause: () => void;
  onDone: () => void;
  onNotThis: () => void;
  onSwap: () => void;
  onUnstick: () => void;
  onTooHard: () => void;
  onOverwhelmed: () => void;
  onDismissHyperfocus: () => void;
}

export function SingleFocusHUD({
  session,
  elapsedMs,
  graceMs,
  restMode,
  unstickOpen,
  canSwap,
  hyperfocusMinutes,
  previewHyperfocus,
  bufferPercent,
  onBegin,
  onPause,
  onDone,
  onNotThis,
  onSwap,
  onUnstick,
  onTooHard,
  onOverwhelmed,
  onDismissHyperfocus,
}: Props) {
  const totalMs = session.bufferedMinutes * 60 * 1000;
  const remaining = totalMs - elapsedMs;
  const inGrace = remaining <= 0 && elapsedMs < totalMs + graceMs;
  const display = remaining > 0 ? formatMmSs(remaining) : '0:00';
  const running = session.runState === 'running';
  const paused = session.runState === 'paused';
  const showHyperfocus = shouldShowHyperfocus(
    elapsedMs,
    hyperfocusMinutes,
    Boolean(session.hyperfocusDismissed),
    Boolean(previewHyperfocus)
  );

  return (
    <div className={styles.wrap}>
      <article
        className={`${styles.card} ${unstickOpen ? styles.dimmed : ''}`}
        aria-label="Focus"
      >
        <p className={ui.label}>Focus</p>
        <h1 className={styles.title}>{session.title}</h1>
        <p className={styles.timer} aria-live="polite">
          {paused ? 'Paused · ' : null}
          {display}
          {inGrace ? <span className={ui.srOnly}> quiet extra minutes</span> : null}
        </p>
        <p className={styles.dod}>
          {session.rawMinutes} min → {session.bufferedMinutes} min displayed (+
          {bufferPercent}%)
        </p>
        {session.dod ? <p className={styles.dod}>{session.dod}</p> : null}

        {showHyperfocus ? (
          <div className={styles.chip} role="status">
            <p className={styles.chipText}>{t('hyperfocus.chip')}</p>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnMuted}`}
              onClick={onDismissHyperfocus}
            >
              {t('hyperfocus.dismiss')}
            </button>
          </div>
        ) : null}

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
                onClick={onTooHard}
              >
                {t('hud.tooHard')}
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={onOverwhelmed}
              >
                {t('hud.overwhelmed')}
              </button>
            </div>
            <p className={ui.meta}>{t('hud.tooHard.hint')}</p>

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
