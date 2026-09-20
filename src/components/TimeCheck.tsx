import type { AnchorBlock, Settings } from '../types';
import { formatElapsedFriendly, formatUntil, formatWallClock, hhmmToMinutes, dateAtHHMM } from '../utils/time';
import { suggestNext } from './TodaysRails';
import ui from './ui.module.css';

interface Props {
  lastCheckAt: number | null;
  blocks: AnchorBlock[];
  settings: Settings;
  now: Date;
  onCheck: () => void;
  onBack: () => void;
}

export function TimeCheck({
  lastCheckAt,
  blocks,
  settings,
  now,
  onCheck,
  onBack,
}: Props) {
  const next = suggestNext(blocks, settings, now);
  const since = lastCheckAt ? formatElapsedFriendly(now.getTime() - lastCheckAt) : 'no check yet';

  let untilLabel = '—';
  if (next) {
    const nextAt = dateAtHHMM(next.plannedStart, now);
    const diff = nextAt.getTime() - now.getTime();
    if (hhmmToMinutes(next.plannedStart) <= now.getHours() * 60 + now.getMinutes() && next.status === 'now') {
      untilLabel = `${next.name} is now`;
    } else {
      untilLabel = `${next.name} ${formatUntil(diff)} (${next.plannedStart})`;
    }
  }

  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Time check</h1>
          <p className={ui.subtitle}>Make the clock visible for a moment.</p>
        </div>
        <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onBack}>
          Back
        </button>
      </header>

      <div className={`${ui.card} ${ui.stack}`} style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Wall clock</p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '3rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          {formatWallClock(now)}
        </p>
        <p style={{ margin: 0 }}>Last check: {since}</p>
        <p style={{ margin: 0 }}>Next planned: {untilLabel}</p>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={onCheck}
        >
          Check in now
        </button>
      </div>
    </div>
  );
}
