// src/components/common/Notification.tsx
import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const iconMap = {
    success: <CheckCircle className="w-12 h-12 text-emerald-500" />,
    error: <XCircle className="w-12 h-12 text-red-500" />,
    warning: <AlertTriangle className="w-12 h-12 text-amber-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />
  };

  const bgMap = {
    success: 'border-t-4 border-t-emerald-500',
    error: 'border-t-4 border-t-red-500',
    warning: 'border-t-4 border-t-amber-500',
    info: 'border-t-4 border-t-blue-500'
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className={`max-w-sm text-center ${bgMap[type]}`}>
        <div className="flex flex-col items-center gap-4 py-4">
          {iconMap[type]}
          <p className="text-sm text-foreground">{message}</p>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Notification;
