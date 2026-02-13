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
import { Trash2, AlertTriangle, Info } from 'lucide-react';

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
    danger: <Trash2 className="w-10 h-10 text-red-500" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-500" />,
    info: <Info className="w-10 h-10 text-blue-500" />
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
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={type === 'danger' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
