// src/components/modals/PriceOfferModal.tsx
import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import Badge from '../common/Badge';
import { offerService } from '../../api/services/offerService';
import { useAuth } from '../../contexts/AuthContext';
import type { Offer } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Send, ThumbsUp, ThumbsDown } from 'lucide-react';

interface PriceOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number | null;
  projectName?: string;
  onChanged?: () => void;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const formatPrice = (value?: number) =>
  value == null ? '–' : value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export const PriceOfferModal: React.FC<PriceOfferModalProps> = ({ isOpen, onClose, projectId, projectName, onChanged }) => {
  const { admin } = useAuth();
  const isOwner = admin?.role === 'Owner';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [scope, setScope] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [termMonths, setTermMonths] = useState<12 | 24>(12);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });

  const notify = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      offerService.getByProjectId(projectId)
        .then(o => {
          setOffer(o);
          setScope(o.scope || '');
          setFixedPrice(o.fixedPrice != null ? String(o.fixedPrice) : '');
          setTermMonths(o.termMonths === 24 ? 24 : 12);
        })
        .catch(() => notify('error', 'Angebot konnte nicht geladen werden.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId]);

  const previewMonthly = fixedPrice ? Math.round((parseFloat(fixedPrice) * 1.05 / termMonths) * 100) / 100 : undefined;

  const handleSaveDraft = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      const result = await offerService.saveDraft(projectId, {
        scope,
        fixedPrice: fixedPrice ? parseFloat(fixedPrice) : undefined,
        termMonths,
      });
      setOffer(result);
      notify('success', 'Entwurf gespeichert.');
      onChanged?.();
    } catch {
      notify('error', 'Entwurf konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async () => {
    if (!projectId) return;
    setConfirmRelease(false);
    try {
      setSaving(true);
      // Persist the current form values first so an edit made just before releasing
      // (e.g. changing the Festpreis or Laufzeit) is never silently dropped.
      await offerService.saveDraft(projectId, {
        scope,
        fixedPrice: fixedPrice ? parseFloat(fixedPrice) : undefined,
        termMonths,
      });
      const result = await offerService.release(projectId);
      setOffer(result);
      notify('success', 'Preis an Kreavolut freigegeben.');
      onChanged?.();
    } catch {
      notify('error', 'Preis konnte nicht freigegeben werden. Bitte zuerst einen Festpreis speichern.');
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async (accepted: boolean) => {
    if (!offer) return;
    try {
      setSaving(true);
      const result = accepted ? await offerService.accept(offer.offerID) : await offerService.reject(offer.offerID);
      setOffer(result);
      notify('success', accepted ? 'Angebot als angenommen markiert.' : 'Angebot als abgelehnt markiert.');
      onChanged?.();
    } catch {
      notify('error', 'Aktion konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = isOwner && (!offer || offer.status === 'Entwurf' || offer.status === 'Abgelehnt');
  const canRespond = offer?.status === 'Freigegeben';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preisangebot – ${projectName ?? ''}`}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Angebot wird geladen…</p>
        </div>
      ) : (
        <div className="space-y-5">
          {offer && <div><Badge status={offer.status} /></div>}

          {canEdit ? (
            <>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leistungsumfang</Label>
                <Textarea rows={5} value={scope} onChange={e => setScope(e.target.value)} placeholder="Beschreibung der Leistungen..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Einmaliger Festpreis (€)</Label>
                  <Input type="number" min="0" step="0.01" value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} placeholder="z.B. 2500" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Laufzeit</Label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={termMonths === 12 ? 'default' : 'outline'} className="flex-1" onClick={() => setTermMonths(12)}>1 Jahr</Button>
                    <Button type="button" size="sm" variant={termMonths === 24 ? 'default' : 'outline'} className="flex-1" onClick={() => setTermMonths(24)}>2 Jahre</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monatlicher Preis (automatisch: Festpreis + 5%, verteilt über {termMonths} Monate)</Label>
                <Input value={formatPrice(previewMonthly)} disabled readOnly />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Entwurf speichern
                </Button>
                <Button type="button" onClick={() => setConfirmRelease(true)} disabled={saving || !fixedPrice}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />Preis freigeben
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leistungsumfang</p>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{offer?.scope || '–'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Einmaliger Preis</p>
                  <p className="text-sm text-foreground mt-0.5">{formatPrice(offer?.fixedPrice)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monatlicher Preis</p>
                  <p className="text-sm text-foreground mt-0.5">{formatPrice(offer?.monthlyPrice)} {offer && <span className="text-muted-foreground">(über {offer.termMonths} Monate)</span>}</p>
                </div>
              </div>
            </>
          )}

          {canRespond && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleRespond(false)} disabled={saving}>
                <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />Als abgelehnt markieren
              </Button>
              <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRespond(true)} disabled={saving}>
                <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />Als angenommen markieren
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmRelease}
        title="Preis freigeben?"
        message="Dies versendet eine E-Mail mit dem Angebot an Kreavolut (info@kreavolut.de)."
        confirmText="Freigeben"
        type="info"
        onConfirm={handleRelease}
        onCancel={() => setConfirmRelease(false)}
      />

      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
    </Modal>
  );
};
