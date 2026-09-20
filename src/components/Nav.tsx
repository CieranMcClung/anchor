import type { View } from '../types';
import ui from './ui.module.css';

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  hidden?: boolean;
}

const ITEMS: { view: View; label: string; icon: string }[] = [
  { view: 'home', label: 'Home', icon: '◉' },
  { view: 'start-door', label: 'Start', icon: '▸' },
  { view: 'time-check', label: 'Time', icon: '◷' },
  { view: 'parking', label: 'Park', icon: '⤵' },
  { view: 'settings', label: 'Settings', icon: '⚙' },
];

export function Nav({ view, onNavigate, hidden }: Props) {
  if (hidden) return null;
  return (
    <nav className={ui.nav} aria-label="Main">
      <div className={ui.navInner}>
        {ITEMS.map((item) => {
          const active =
            view === item.view ||
            (item.view === 'home' && (view === 'soft-close' || view === 'home'));
          return (
            <button
              key={item.view}
              type="button"
              className={`${ui.navBtn} ${active ? ui.navBtnActive : ''}`}
              onClick={() => onNavigate(item.view)}
            >
              <span className={ui.navIcon} aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
