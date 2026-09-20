import type { Load } from '../types';
import { ATOMIC_ESTIMATE_MAX } from '../types';
import { t } from '../copy/t';
import type { AtomicTask } from '../utils/aiBrainDump';
import { bufferedMinutes } from '../utils/duration';
import { loadChipLabel } from '../utils/routingHints';
import ui from './ui.module.css';
import styles from './BrainDumpReview.module.css';

export interface ReviewRow extends AtomicTask {
  selected: boolean;
}

interface Props {
  rows: ReviewRow[];
  bufferPercent: number;
  onChange: (rows: ReviewRow[]) => void;
  onCommit: () => void;
  onReject: () => void;
}

export function BrainDumpReview({
  rows,
  bufferPercent,
  onChange,
  onCommit,
  onReject,
}: Props) {
  const selectedCount = rows.filter((row) => row.selected && row.text.trim()).length;

  const patch = (index: number, partial: Partial<ReviewRow>) => {
    onChange(
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...partial };
        next.bufferedMinutes = bufferedMinutes(next.estimateMinutes, bufferPercent);
        return next;
      })
    );
  };

  return (
    <>
      <p className={ui.cue}>{t('aiBrainDump.review')}</p>
      <div className={styles.list}>
        {rows.map((row, i) => (
          <div key={`dump-${i}`} className={styles.card}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={row.selected}
                onChange={(e) => patch(i, { selected: e.target.checked })}
              />
              <span className={ui.srOnly}>Include this one</span>
            </label>
            <div className={styles.fields}>
              <input
                className={ui.input}
                value={row.text}
                onChange={(e) => patch(i, { text: e.target.value })}
                aria-label={`Task ${i + 1}`}
              />
              <div className={ui.chipRow}>
                {(['low', 'medium', 'high'] as Load[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${ui.chip} ${row.load === opt ? ui.chipActive : ''}`}
                    onClick={() => patch(i, { load: opt })}
                  >
                    {loadChipLabel(opt)}
                  </button>
                ))}
              </div>
              <label className={ui.label}>
                Minutes (before buffer)
                <input
                  className={ui.input}
                  type="number"
                  min={1}
                  max={ATOMIC_ESTIMATE_MAX}
                  value={row.estimateMinutes}
                  onChange={(e) =>
                    patch(i, {
                      estimateMinutes: Math.max(
                        1,
                        Math.min(
                          ATOMIC_ESTIMATE_MAX,
                          Number.parseInt(e.target.value, 10) || 1
                        )
                      ),
                    })
                  }
                />
              </label>
              <p className={ui.meta}>
                Shown as {row.bufferedMinutes} min (+{bufferPercent}%)
                {row.noise ? ` · ${t('aiBrainDump.noise')}` : ''}
                {row.dependsOn != null && rows[row.dependsOn]
                  ? ` · ${t('aiBrainDump.after')} ${rows[row.dependsOn]!.text}`
                  : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
        onClick={onCommit}
        disabled={selectedCount === 0}
      >
        {t('aiBrainDump.commit')}
      </button>
      <button
        type="button"
        className={`${ui.btn} ${ui.btnMuted}`}
        onClick={onReject}
      >
        {t('aiBrainDump.reject')}
      </button>
    </>
  );
}
