import ui from './ui.module.css';

interface Props {
  task: string;
  microStep: string;
  onContinue: (minutes: number) => void;
  onPark: () => void;
  onDone: () => void;
}

export function FocusDone({ task, microStep, onContinue, onPark, onDone }: Props) {
  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Timer ended</h1>
          <p className={ui.subtitle}>No rush. Choose what feels right.</p>
        </div>
      </header>

      <div className={`${ui.card} ${ui.stack}`}>
        <div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{task}</p>
          <p style={{ margin: '0.35rem 0 0', fontWeight: 650 }}>{microStep}</p>
        </div>

        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={() => onContinue(5)}
        >
          Continue (+5 min)
        </button>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnSecondary}`}
          onClick={() => onContinue(2)}
        >
          Another 2 minutes
        </button>
        <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onDone}>
          Mark done
        </button>
        <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onPark}>
          Park it for later
        </button>
      </div>
    </div>
  );
}
