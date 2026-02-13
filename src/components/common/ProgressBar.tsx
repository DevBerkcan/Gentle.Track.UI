import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  height = '8px'
}) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <Progress
        value={progress}
        className="flex-1"
        style={{ height }}
      />
      {showLabel && <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}%</span>}
    </div>
  );
};

export default ProgressBar;
