import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  gradient?: string; // kept for backwards compat, ignored
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor = 'text-primary', iconBg = 'bg-primary/10' }) => {
  return (
    <Card className="bg-white border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-default group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{value.toLocaleString('de-DE')}</p>
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
