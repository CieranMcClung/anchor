import { t } from '../copy/t';
import type { Anchor, Load, ParkItem } from '../types';
import { loadCue } from '../utils/defaults';
import { LoadBadge } from './LoadBadge';
import styles from './DailyAnchorsList.module.css';
import ui from './ui.module.css';

interface Props {
  load: Load;
  anchors: Anchor[];
  park: ParkItem[];
  restMode: boolean;
  canAdd: boolean;
  onStart: (anchor: Anchor) => void;
  onChangeLoad: () => void;
  onAdd: () => void;
  onStartPark: (item: ParkItem) => void;
  onRemovePark: (id: string) => void;
}

export function DailyAnchorsList({
  load,
  anchors,
  park,
  restMode,
  canAdd,
  onStart,
  onChangeLoad,
  onAdd,
  onStartPark,
  onRemovePark,
}: Props) {
  const open = anchors.filter((a) => a.status === 'open');
  const done = anchors.filter((a) => a.status === 'done');

  return (
    <section className={ui.stack}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={ui.screenTitle}>Today</h1>
          <p className={ui.cue}>{loadCue(load)}</p>
        </div>
        <button
          type="button"
          className={styles.loadBtn}
          onClick={onChangeLoad}
          aria-label={`Load ${load}. Change load.`}
        >
          <LoadBadge load={load} />
        </button>
      </div>

      {open.length === 0 && done.length === 0 ? (
        <div className={ui.card}>
          <h2 className={ui.label}>{t('empty.noAnchors.title')}</h2>
          <p className={ui.cue}>{t('empty.noAnchors.body')}</p>
          {!restMode && canAdd ? (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
              onClick={onAdd}
            >
              {t('empty.noAnchors.cta')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.list}>
          {open.map((anchor) => (
            <button
              key={anchor.id}
              type="button"
              className={styles.rowBtn}
              disabled={restMode}
              onClick={() => onStart(anchor)}
            >
              <span>
                <p className={styles.title}>{anchor.title}</p>
                <span className={styles.metaLine}>
                  <LoadBadge load={anchor.load} />
                  <span className={ui.meta}>{anchor.bufferedMinutes} min</span>
                </span>
              </span>
            </button>
          ))}
          {done.map((anchor) => (
            <div
              key={anchor.id}
              className={`${styles.rowBtn} ${ui.doneRow}`}
            >
              <span>
                <p className={styles.title}>{anchor.title}</p>
                <span className={styles.metaLine}>
                  <LoadBadge load={anchor.load} />
                  <span className={ui.meta}>{t('task.complete.title')}</span>
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {!restMode && canAdd && (open.length > 0 || done.length > 0) ? (
        <button
          type="button"
          className={`${ui.btn} ${ui.btnGhost}`}
          onClick={onAdd}
        >
          {t('empty.noAnchors.cta')}
        </button>
      ) : null}

      {park.length > 0 ? (
        <div className={ui.block}>
          <h2 className={ui.label}>Parked</h2>
          <div className={styles.list}>
            {park.map((item) => (
              <div key={item.id} className={styles.rowBtn}>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnMuted}`}
                  style={{ flex: 1, textAlign: 'left', padding: 0, minHeight: 48 }}
                  disabled={restMode}
                  onClick={() => onStartPark(item)}
                >
                  {item.text}
                </button>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnMuted}`}
                  aria-label="Remove from park"
                  onClick={() => onRemovePark(item.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
