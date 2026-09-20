import type { PropsWithChildren } from 'react';
import { t } from '../copy/t';
import type { Route } from '../types';
import ui from './ui.module.css';

interface Props {
  route: Route;
  onNavigate: (route: Route) => void;
  restMode: boolean;
}

const ITEMS: { route: Route; label: string }[] = [
  { route: 'today', label: 'Today' },
  { route: 'meds', label: 'Meds' },
  { route: 'rest', label: 'Rest' },
];

export function AppShell({
  route,
  onNavigate,
  restMode,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div className={ui.shell}>
      <div className={ui.wordmark}>{t('brand.appName')}</div>
      <main className={ui.main}>{children}</main>
      <nav className={ui.nav} aria-label="Main">
        <div className={ui.navInner}>
          {ITEMS.map((item) => {
            const active = route === item.route;
            return (
              <button
                key={item.route}
                type="button"
                className={`${ui.navBtn} ${active ? ui.navBtnActive : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(item.route)}
              >
                {item.label}
                {item.route === 'rest' && restMode ? (
                  <span className={ui.srOnly}> (on)</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
