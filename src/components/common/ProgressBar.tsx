import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, showLabel = true }) => {
  const clamped = Math.min(100, Math.max(0, progress));

  const colorClass =
    clamped >= 100 ? 'bg-teal' :
    clamped >= 34  ? 'bg-primary' :
    clamped > 0    ? 'bg-warning' :
                     'bg-border';

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-8 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
