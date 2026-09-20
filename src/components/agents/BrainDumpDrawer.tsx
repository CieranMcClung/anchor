import { useEffect, useMemo, useRef, useState } from 'react';
import {
  parseBrainDump,
  speechRecognitionAvailable,
  type ParsedDumpTask,
} from '../../agents/brainDump';
import { LOAD_COPY } from '../../types';
import styles from './AgentBanner.module.css';
import ui from '../ui.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onCommit: (tasks: ParsedDumpTask[]) => void;
}

type SpeechRec = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRec) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function BrainDumpDrawer({ open, onClose, onCommit }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const voiceOk = speechRecognitionAvailable();
  const parsed = useMemo(() => parseBrainDump(text), [text]);

  useEffect(() => {
    if (!open) {
      setListening(false);
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  if (!open) return null;

  const toggleMic = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-GB';
    rec.onresult = (ev) => {
      let chunk = '';
      for (let i = 0; i < ev.results.length; i++) {
        chunk += ev.results[i][0]?.transcript ?? '';
      }
      if (chunk.trim()) setText(chunk.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const handleCommit = () => {
    if (parsed.tasks.length === 0) return;
    onCommit(parsed.tasks);
    setText('');
    onClose();
  };

  return (
    <div
      className={styles.drawerBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Brain dump capture"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.drawer}>
        <div className={styles.drawerHandle} aria-hidden />
        <header className={ui.header} style={{ marginBottom: '0.75rem' }}>
          <div>
            <h2 className={ui.title} style={{ fontSize: '1.1rem' }}>
              Brain dump
            </h2>
            <p className={ui.subtitle}>
              Dump it messy — Anchor sorts load and time (+40% buffer).
            </p>
          </div>
          <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onClose}>
            Close
          </button>
        </header>

        <div className={ui.field}>
          <label htmlFor="brain-dump">What’s swirling?</label>
          <textarea
            id="brain-dump"
            className={ui.textarea}
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. email boss, tidy desk 10 min, deep work on report tomorrow…"
            autoFocus
          />
        </div>

        <div className={ui.row} style={{ marginTop: '0.55rem' }}>
          {voiceOk ? (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSecondary} ${styles.micBtn} ${
                listening ? styles.micActive : ''
              }`}
              onClick={toggleMic}
              aria-pressed={listening}
            >
              {listening ? 'Stop mic' : 'Mic'}
            </button>
          ) : (
            <p className={ui.hint} style={{ margin: 0, flex: 1 }}>
              Voice capture isn’t available in this browser — text only.
            </p>
          )}
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            style={{ flex: 1, width: 'auto' }}
            disabled={parsed.tasks.length === 0}
            onClick={handleCommit}
          >
            Capture {parsed.tasks.length || ''}
          </button>
        </div>

        {parsed.tasks.length > 0 && (
          <div className={styles.preview}>
            <p className={ui.hint} style={{ margin: 0 }}>
              Preview · heuristic parse
            </p>
            {parsed.tasks.map((t, i) => (
              <div key={`${t.text}-${i}`} className={styles.previewItem}>
                <strong>{t.text}</strong>
                <div className={styles.previewMeta}>
                  {LOAD_COPY[t.cognitiveLoad]} · ~{t.estimateMinutes} min → buffered{' '}
                  {t.bufferedMinutes} min · {t.destination}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className={ui.hint}>
          Shortcut: <kbd>c</kbd> or <kbd>/</kbd> · lists, commas, “tomorrow” work.
        </p>
      </div>
    </div>
  );
}

export function BrainDumpFab({ onClick, hidden }: { onClick: () => void; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <button
      type="button"
      className={styles.fab}
      onClick={onClick}
      aria-label="Quick capture brain dump"
      title="Capture (c)"
    >
      +
    </button>
  );
}
