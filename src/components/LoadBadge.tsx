import type { Load } from '../types';
import ui from './ui.module.css';

const COPY: Record<Load, { label: string; className: string }> = {
  low: { label: 'Low', className: ui.badgeLow },
  medium: { label: 'Med', className: ui.badgeMed },
  high: { label: 'High', className: ui.badgeHigh },
};

export function LoadBadge({ load }: { load: Load }) {
  const c = COPY[load];
  return (
    <span className={`${ui.badge} ${c.className}`}>
      {c.label}
      <span className={ui.srOnly}> load</span>
    </span>
  );
}
