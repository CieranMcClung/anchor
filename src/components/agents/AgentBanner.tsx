import styles from './AgentBanner.module.css';
import ui from '../ui.module.css';

interface Action {
  label: string;
  onClick: () => void;
  primary?: boolean;
  ghost?: boolean;
}

interface Props {
  title: string;
  body: string;
  tone?: 'soft' | 'warn';
  actions: Action[];
}

/** Soft, dismissible agent prompt — never a red alarm. */
export function AgentBanner({ title, body, tone = 'soft', actions }: Props) {
  return (
    <div
      className={`${styles.banner} ${tone === 'warn' ? styles.bannerWarn : styles.bannerSoft}`}
      role="status"
    >
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{body}</p>
      <div className={styles.actions}>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className={`${ui.btn} ${
              a.primary
                ? ui.btnPrimary
                : a.ghost
                  ? ui.btnGhost
                  : ui.btnSecondary
            }`}
            onClick={a.onClick}
            style={a.ghost ? { alignSelf: 'flex-start' } : undefined}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
