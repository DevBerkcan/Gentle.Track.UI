import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status: string;
  style?: React.CSSProperties;
}

// Statusfarben nach Gentle-Track-Markenrichtlinie:
// Teal/Success = fertig · Indigo = aktiv · Amber = wartet · Rot = blockiert · Grau = geplant
const statusStyles: Record<string, string> = {
  'Planung':              'bg-secondary text-foreground/70 border border-border',
  'In Bearbeitung':       'bg-accent text-accent-foreground border border-accent-foreground/15',
  'Warten auf Feedback':  'bg-warning-bg text-[#9A6510] border border-warning/20',
  'Abgeschlossen':        'bg-success-bg text-[#15805A] border border-success/20',
  'Aktiv':                'bg-success-bg text-[#15805A] border border-success/20',
  'Inaktiv':              'bg-secondary text-foreground/70 border border-border',
  'Super Admin':          'bg-accent text-accent-foreground border border-accent-foreground/15',
  'Admin':                'bg-info-bg text-[#2557B0] border border-info/20',
  'Projektmanager':       'bg-warning-bg text-[#9A6510] border border-warning/20',
  'Freigegeben':          'bg-success-bg text-[#15805A] border border-success/20',
  'Angenommen':           'bg-success-bg text-[#15805A] border border-success/20',
  'Abgelehnt':            'bg-error-bg text-[#A23531] border border-error/20',
};

const dotColors: Record<string, string> = {
  'Planung':              'bg-text-muted',
  'In Bearbeitung':       'bg-primary',
  'Warten auf Feedback':  'bg-warning',
  'Abgeschlossen':        'bg-success',
  'Aktiv':                'bg-success',
  'Inaktiv':              'bg-text-muted',
  'Super Admin':          'bg-primary',
  'Admin':                'bg-info',
  'Projektmanager':       'bg-warning',
  'Freigegeben':          'bg-success',
  'Angenommen':           'bg-success',
  'Abgelehnt':            'bg-error',
};

const Badge: React.FC<BadgeProps> = ({ status, style }) => {
  const badgeClass = statusStyles[status] ?? 'bg-secondary text-foreground/70 border border-border';
  const dotClass = dotColors[status] ?? 'bg-text-muted';

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', badgeClass)}
      style={style}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClass)} />
      {status}
    </span>
  );
};

export default Badge;
