import { useEffect, useMemo, useState } from 'react';
import type { FocusSession, MicroDeconstruction } from '../types';
import { AgentBanner } from './agents/AgentBanner';
import styles from './FocusView.module.css';
import bannerStyles from './agents/AgentBanner.module.css';
import ui from './ui.module.css';
import { useAmbient } from '../hooks/useAmbient';
import { useClock } from '../hooks/useClock';
import { SOMATIC_COPY } from '../agents/somatic';
import { formatDuration, formatWallClock } from '../utils/time';
import { ProgressRing } from './ProgressRing';

interface Props {
  session: FocusSession;
  ambientEnabled: boolean;
  showSomaticPrompt?: boolean;
  onPark: () => void;
  onDone: () => void;
  onFinished: () => void;
  onOpenParking: () => void;
  /** Start Un-Stick: fragment into three micro-steps. */
  onParalyzed: () => void;
  onCompleteMicroStep: () => void;
  onToggleBodyDouble?: () => void;
  onInteract?: () => void;
  onSomaticStart?: () => void;
  onSomaticDismiss?: () => void;
  onSomaticMicro?: () => void;
}

export function FocusView({
  session,
  ambientEnabled,
  showSomaticPrompt = false,
  onPark,
  onDone,
  onFinished,
  onOpenParking,
  onParalyzed,
  onCompleteMicroStep,
  onToggleBodyDouble,
  onInteract,
  onSomaticStart,
  onSomaticDismiss,
  onSomaticMicro,
}: Props) {
  const now = useClock(250);
  const [finishedFired, setFinishedFired] = useState(false);
  const [dismissedHelper, setDismissedHelper] = useState(false);

  useAmbient(session.bodyDouble && ambientEnabled);

  const decon = session.deconstruction;
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
    !decon &&
    !showSomaticPrompt &&
    elapsed >= 3 * 60 * 1000 &&
    remainingMs > 0;

  useEffect(() => {
    // Deconstruction steps manage their own completion; don't auto-finish early.
    if (decon) return;
    if (remainingMs <= 0 && !finishedFired) {
      setFinishedFired(true);
      onFinished();
    }
  }, [remainingMs, finishedFired, decon, onFinished]);

  const activeStepText = decon
    ? decon.steps[decon.currentIndex]
    : session.microStep;

  const handleCompleteStep = () => {
    onInteract?.();
    if (!decon) {
      onDone();
      return;
    }
    onCompleteMicroStep();
  };

  return (
    <div
      className={ui.screenFocus}
      onPointerDown={() => onInteract?.()}
      onKeyDown={() => onInteract?.()}
    >
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Focus</h1>
          <p className={ui.subtitle}>
            {decon
              ? 'One tiny step. Then the next.'
              : 'Only this step. Nothing else.'}
          </p>
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

      {decon && <DeconBadge decon={decon} />}

      <p className={styles.micro}>{activeStepText}</p>

      {session.definitionOfDone && !decon && (
        <p className={styles.dod}>Done when: {session.definitionOfDone}</p>
      )}

      <ProgressRing progress={progress}>
        <p className={styles.timeBig}>{formatDuration(remainingMs / 1000)}</p>
        <p className={styles.meta}>remaining</p>
      </ProgressRing>

      <p
        className={styles.meta}
        style={{ textAlign: 'center', marginTop: '0.85rem' }}
      >
        Elapsed {formatDuration(elapsed / 1000)} · ends {endLabel}
        {session.estimateMinutes !== session.durationMinutes && !decon && (
          <>
            <br />
            Estimate {session.estimateMinutes} min · buffered{' '}
            {session.durationMinutes} min (+40%)
          </>
        )}
        {decon && (
          <>
            <br />
            ~2 min per micro-step
          </>
        )}
      </p>

      {session.bodyDouble && (
        <p className={styles.presence}>
          Quiet presence on
          {ambientEnabled ? ' · soft sound' : ' · sound off'}
        </p>
      )}

      {showSomaticPrompt && onSomaticStart && onSomaticDismiss && (
        <div style={{ marginTop: '1rem' }}>
          <AgentBanner
            title={SOMATIC_COPY.title}
            body={SOMATIC_COPY.body}
            tone="soft"
            actions={[
              {
                label: SOMATIC_COPY.start,
                primary: true,
                onClick: onSomaticStart,
              },
              {
                label: SOMATIC_COPY.micro,
                onClick: () => onSomaticMicro?.() ?? onParalyzed(),
              },
              {
                label: SOMATIC_COPY.dismiss,
                ghost: true,
                onClick: onSomaticDismiss,
              },
            ]}
          />
        </div>
      )}

      {showInitiationHelper && (
        <div className={styles.helper}>
          <p className={styles.helperTitle}>Still finding the start?</p>
          <p className={styles.helperText}>
            No shame — break it into three tiny steps, or keep quiet company.
          </p>
          <div className={styles.helperActions}>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnPrimary}`}
              onClick={onParalyzed}
            >
              Un-stick · 3 micro-steps
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
        {decon ? (
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={handleCompleteStep}
          >
            {decon.currentIndex < 2
              ? `Step ${decon.currentIndex + 1} done · reveal next`
              : 'Step 3 done'}
          </button>
        ) : (
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSecondary} ${styles.stuck}`}
            onClick={onParalyzed}
          >
            I’m Stuck / Paralyzed
          </button>
        )}
        {!decon && (
          <p className={ui.hint} style={{ textAlign: 'center', margin: 0 }}>
            Fragments into three ~2-minute steps — only one shown at a time.
          </p>
        )}
        <div className={styles.sideActions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSecondary}`}
            onClick={onPark}
          >
            Park it
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSecondary}`}
            onClick={onDone}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DeconBadge({ decon }: { decon: MicroDeconstruction }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span className={bannerStyles.stepBadge}>
        Step {decon.currentIndex + 1} of 3
      </span>
      <div className={bannerStyles.stepProgress} aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`${bannerStyles.stepDot} ${
              decon.completed[i]
                ? bannerStyles.stepDotDone
                : i === decon.currentIndex
                  ? bannerStyles.stepDotOn
                  : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}
