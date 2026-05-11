import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status: string;
  style?: React.CSSProperties;
}

const statusStyles: Record<string, string> = {
  'Planung':              'bg-violet-50 text-violet-700 border border-violet-200',
  'In Bearbeitung':       'bg-blue-50 text-blue-700 border border-blue-200',
  'Warten auf Feedback':  'bg-amber-50 text-amber-700 border border-amber-200',
  'Abgeschlossen':        'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Aktiv':                'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Inaktiv':              'bg-zinc-100 text-zinc-600 border border-zinc-200',
  'Super Admin':          'bg-violet-50 text-violet-700 border border-violet-200',
  'Admin':                'bg-blue-50 text-blue-700 border border-blue-200',
  'Projektmanager':       'bg-amber-50 text-amber-700 border border-amber-200',
};

const dotColors: Record<string, string> = {
  'Planung':              'bg-violet-500',
  'In Bearbeitung':       'bg-blue-500',
  'Warten auf Feedback':  'bg-amber-500',
  'Abgeschlossen':        'bg-emerald-500',
  'Aktiv':                'bg-emerald-500',
  'Inaktiv':              'bg-zinc-400',
  'Super Admin':          'bg-violet-500',
  'Admin':                'bg-blue-500',
  'Projektmanager':       'bg-amber-500',
};

const Badge: React.FC<BadgeProps> = ({ status, style }) => {
  const badgeClass = statusStyles[status] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200';
  const dotClass = dotColors[status] ?? 'bg-zinc-400';

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', badgeClass)}
      style={style}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClass)} />
      {status}
    </span>
  );
};

export default Badge;
