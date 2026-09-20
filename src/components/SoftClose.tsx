import { useState } from 'react';
import type { JournalEntry, ParkingItem } from '../types';
import { todayKey } from '../utils/time';
import ui from './ui.module.css';

interface Props {
  startedToday: string[];
  parking: ParkingItem[];
  journal: JournalEntry[];
  onSave: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onParkForTomorrow: (texts: string[]) => void;
  onBack: () => void;
}

export function SoftClose({
  startedToday,
  parking,
  journal,
  onSave,
  onParkForTomorrow,
  onBack,
}: Props) {
  const today = todayKey();
  const existing = journal.find((j) => j.date === today);
  const [medNotes, setMedNotes] = useState(existing?.medNotes ?? '');
  const [extraPark, setExtraPark] = useState('');
  const [saved, setSaved] = useState(!!existing);

  const handleSave = () => {
    const parked = [
      ...parking.map((p) => p.text),
      ...(extraPark.trim() ? [extraPark.trim()] : []),
    ];
    onSave({
      date: today,
      started: startedToday,
      parkedForTomorrow: parked,
      medNotes: medNotes.trim(),
    });
    if (extraPark.trim()) {
      onParkForTomorrow([extraPark.trim()]);
    }
    setSaved(true);
  };

  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Soft close</h1>
          <p className={ui.subtitle}>Evening wrap — gentle, no scorecard.</p>
        </div>
        <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onBack}>
          Back
        </button>
      </header>

      <div className={ui.stack}>
        <div className={`${ui.card} ${ui.stack}`}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>What got started</h2>
            {startedToday.length === 0 ? (
              <p className={ui.hint}>Nothing logged yet — starting still counts tomorrow.</p>
            ) : (
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
                {startedToday.map((t, i) => (
                  <li key={`${t}-${i}`}>{t}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Park for tomorrow</h2>
            <p className={ui.hint}>Current parking lot carries over automatically.</p>
            {parking.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
                {parking.map((p) => (
                  <li key={p.id}>{p.text}</li>
                ))}
              </ul>
            )}
            <div className={ui.field} style={{ marginTop: '0.65rem' }}>
              <label htmlFor="extra-park">Add one more</label>
              <input
                id="extra-park"
                className={ui.input}
                value={extraPark}
                onChange={(e) => setExtraPark(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className={ui.field}>
            <label htmlFor="med-notes">Med-window notes (optional)</label>
            <textarea
              id="med-notes"
              className={ui.textarea}
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
              placeholder="e.g. Peak felt later today; waning earlier…"
              rows={3}
            />
            <p className={ui.disclaimer}>
              Personal estimates only — not medical advice.
            </p>
          </div>

          <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={handleSave}>
            {saved ? 'Update journal' : 'Save soft close'}
          </button>
          {saved && <p className={ui.hint}>Saved locally for {today}.</p>}
        </div>

        {journal.filter((j) => j.date !== today).length > 0 && (
          <div className={`${ui.cardQuiet} ${ui.stack}`}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Earlier entries</h2>
            {journal
              .filter((j) => j.date !== today)
              .slice(0, 5)
              .map((j) => (
                <div key={j.id}>
                  <strong>{j.date}</strong>
                  <p className={ui.hint} style={{ margin: '0.2rem 0 0' }}>
                    Started: {j.started.length ? j.started.join(', ') : '—'}
                    {j.medNotes ? ` · Notes: ${j.medNotes}` : ''}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
