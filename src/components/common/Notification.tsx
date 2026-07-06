// src/components/common/Notification.tsx
import { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

const config = {
  success: {
    icon: CheckCircle2,
    classes: 'bg-success-bg border-success/25 text-[#15805A]',
    iconClass: 'text-success',
    bar: 'bg-success',
  },
  error: {
    icon: XCircle,
    classes: 'bg-error-bg border-error/25 text-[#A23531]',
    iconClass: 'text-error',
    bar: 'bg-error',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-warning-bg border-warning/25 text-[#9A6510]',
    iconClass: 'text-warning',
    bar: 'bg-warning',
  },
  info: {
    icon: Info,
    classes: 'bg-primary/5 border-primary/20 text-primary',
    iconClass: 'text-primary',
    bar: 'bg-primary',
  },
};

const Notification: React.FC<NotificationProps> = ({ type, message, onClose, duration = 3500 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { icon: Icon, classes, iconClass, bar } = config[type];

  return (
    <div className="fixed top-5 right-5 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={cn('flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm min-w-[280px]', classes)}>
        <div className={cn('w-5 h-5 mt-0.5 shrink-0', iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium flex-1 leading-snug">{message}</p>
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Fortschrittsbalken */}
      <div className="h-0.5 rounded-b-xl overflow-hidden">
        <div
          className={cn('h-full', bar)}
          style={{ animation: `shrinkWidth ${duration}ms linear forwards` }}
        />
      </div>
      <style>{`
        @keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default Notification;
