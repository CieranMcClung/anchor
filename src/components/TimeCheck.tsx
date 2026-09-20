import type { AnchorBlock, DoseLog, ParkingItem, Settings } from '../types';
import { suggestNextAction } from '../utils/suggestNext';
import {
  dateAtHHMM,
  formatElapsedFriendly,
  formatUntil,
  formatWallClock,
  hhmmToMinutes,
} from '../utils/time';
import ui from './ui.module.css';

interface Props {
  lastCheckAt: number | null;
  blocks: AnchorBlock[];
  parking: ParkingItem[];
  settings: Settings;
  doseLog: DoseLog;
  now: Date;
  onCheck: () => void;
  onBack: () => void;
}

export function TimeCheck({
  lastCheckAt,
  blocks,
  parking,
  settings,
  doseLog,
  now,
  onCheck,
  onBack,
}: Props) {
  const next = suggestNextAction(blocks, parking, settings, doseLog, now);
  const since = lastCheckAt
    ? formatElapsedFriendly(now.getTime() - lastCheckAt)
    : 'no check yet';

  let untilLabel = '—';
  if (next?.kind === 'anchor') {
    const block = next.block;
    const nextAt = dateAtHHMM(block.plannedStart, now);
    const diff = nextAt.getTime() - now.getTime();
    if (
      hhmmToMinutes(block.plannedStart) <=
        now.getHours() * 60 + now.getMinutes() &&
      block.status === 'now'
    ) {
      untilLabel = `${block.name} is now`;
    } else {
      untilLabel = `${block.name} ${formatUntil(diff)} (${block.plannedStart})`;
    }
  } else if (next?.kind === 'parking') {
    untilLabel = `Parked: ${next.item.text}`;
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
        <p style={{ margin: 0 }}>Suggested next: {untilLabel}</p>
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={onCheck}>
          Check in now
        </button>
      </div>
    </div>
  );
}
