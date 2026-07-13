import React, { type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 'lg' gives extra width for content with wide button rows (e.g. multi-step forms). 'xl' is for dense, single-page read-only summaries that need room to avoid scrolling. */
  size?: 'default' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'default' }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={cn(
        // DialogContent's base classes set `sm:max-w-lg`; since that responsive variant is
        // emitted later in Tailwind's stylesheet, a bare `max-w-[Npx]` here would lose the
        // cascade at >=640px. Overriding with the same `sm:` variant keeps them in the same
        // tailwind-merge slot so ours properly replaces it instead of silently losing.
        'w-[calc(100%-2rem)] max-h-[92vh] overflow-y-auto',
        size === 'xl' ? 'max-w-[1200px] sm:max-w-[1200px]' : size === 'lg' ? 'max-w-[760px] sm:max-w-[760px]' : 'max-w-[600px] sm:max-w-[600px]'
      )}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
