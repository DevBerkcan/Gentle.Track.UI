import React from 'react';
import { Badge as ShadcnBadge } from '@/components/ui/badge';

interface BadgeProps {
  status: string;
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({ status, style }) => {
  const getBadgeClasses = (status: string): string => {
    const badges: Record<string, string> = {
      'Planung': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
      'In Bearbeitung': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
      'Warten auf Feedback': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
      'Abgeschlossen': 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      'Aktiv': 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      'Inaktiv': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
      'Super Admin': 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      'Admin': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
      'Projektmanager': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
    };
    return badges[status] || 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
  };

  return (
    <ShadcnBadge variant="outline" className={`text-xs font-medium ${getBadgeClasses(status)}`} style={style}>
      {status}
    </ShadcnBadge>
  );
};

export default Badge;
