import { t, tf, type StringKey } from '../copy/t';
import type { Anchor, Load, ParkItem, PkZone } from '../types';
import { loadCue } from '../utils/defaults';
import { zoneLabel } from '../utils/pk';
import { loadChipLabel, loadFitsZone, suggestedLoadsForZone } from '../utils/routingHints';
import { LoadBadge } from './LoadBadge';
import styles from './DailyAnchorsList.module.css';
import ui from './ui.module.css';

interface Props {
  load: Load;
  anchors: Anchor[];
  park: ParkItem[];
  restMode: boolean;
  canAdd: boolean;
  zone: PkZone;
  bufferPercent: number;
  doneCount: number;
  parkedToday: number;
  onStart: (anchor: Anchor) => void;
  onChangeLoad: () => void;
  onAdd: () => void;
  onStartPark: (item: ParkItem) => void;
  onRemovePark: (id: string) => void;
}

const ZONE_HINT: Record<PkZone, StringKey> = {
  onset: 'routing.hint.onset',
  peak: 'routing.hint.peak',
  comedown: 'routing.hint.comedown',
  unknown: 'routing.hint.unknown',
};

export function DailyAnchorsList({
  load,
  anchors,
  park,
  restMode,
  canAdd,
  zone,
  bufferPercent,
  doneCount,
  parkedToday,
  onStart,
  onChangeLoad,
  onAdd,
  onStartPark,
  onRemovePark,
}: Props) {
  const open = anchors.filter((a) => a.status === 'open');
  const done = anchors.filter((a) => a.status === 'done');
  const suggested = suggestedLoadsForZone(zone);

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

      <p className={ui.meta} style={{ margin: 0 }}>
        {tf('momentum.line', { done: doneCount, parked: parkedToday })} · {t('momentum.hint')}
      </p>

      <div>
        <div className={ui.chipRow}>
          <span className={`${ui.chip} ${ui.chipActive}`}>
            {zoneLabel(zone)}
          </span>
          {(['low', 'medium', 'high'] as Load[]).map((opt) => {
            const fits = suggested.includes(opt);
            return (
              <span
                key={opt}
                className={`${ui.chip} ${fits ? ui.chipActive : ''}`}
              >
                {loadChipLabel(opt)}
                {fits ? ` · ${t('routing.fits')}` : ''}
              </span>
            );
          })}
        </div>
        <p className={ui.meta} style={{ marginTop: 8 }}>
          {t(ZONE_HINT[zone])} · +{bufferPercent}% on shown times
        </p>
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
          {open.map((anchor) => {
            const fits = loadFitsZone(anchor.load, zone);
            return (
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
                    {fits && zone !== 'unknown' ? (
                      <span className={ui.meta}>{t('routing.fits')}</span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
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
