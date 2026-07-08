// src/components/common/ConfirmDialog.tsx
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle, Info, Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  const iconMap = {
    danger: <Trash2 className="w-10 h-10 text-error" />,
    warning: <AlertTriangle className="w-10 h-10 text-warning" />,
    info: <Info className="w-10 h-10 text-info" />
  };

  const confirmIconMap = {
    danger: <Trash2 className="w-3.5 h-3.5 mr-1.5" />,
    warning: <Check className="w-3.5 h-3.5 mr-1.5" />,
    info: <Check className="w-3.5 h-3.5 mr-1.5" />
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="max-w-md">
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="p-3 rounded-full bg-muted">
            {iconMap[type]}
          </div>
        </div>
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel onClick={onCancel}>
            <X className="w-3.5 h-3.5 mr-1.5" />{cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={type === 'danger' ? 'bg-error hover:bg-error/90' : ''}
          >
            {confirmIconMap[type]}{confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
