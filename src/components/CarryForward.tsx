import { t } from '../copy/t';
import type { CarryCandidate } from '../types';
import ui from './ui.module.css';

interface Props {
  candidates: CarryCandidate[];
  onChoose: (candidate: CarryCandidate | null) => void;
}

export function CarryForward({ candidates, onChoose }: Props) {
  if (candidates.length === 0) return null;
  return (
    <section className={ui.stack}>
      <div>
        <h1 className={ui.screenTitle}>{t('habit.reset.title')}</h1>
        <p className={ui.cue}>
          Bring one forward if you want. The rest can sit in Park.
        </p>
      </div>
      {candidates.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`}
          onClick={() => onChoose(c)}
        >
          {c.title}
        </button>
      ))}
      <button
        type="button"
        className={`${ui.btn} ${ui.btnMuted}`}
        onClick={() => onChoose(null)}
      >
        Park them
      </button>
    </section>
  );
}
