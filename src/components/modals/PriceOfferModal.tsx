// src/components/modals/PriceOfferModal.tsx
import { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import Badge from '../common/Badge';
import { offerService } from '../../api/services/offerService';
import { useAuth } from '../../contexts/AuthContext';
import type { Offer, PricingTemplate } from '../../types';
import { TEMPLATE_CONFIG, HYBRID_TERM_OPTIONS, computeOfferPricing } from '../../utils/offerPricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const TEMPLATE_ORDER: PricingTemplate[] = ['Einmalzahlung', 'Hybrid', 'Monatlich12', 'Monatlich24'];

export const PriceOfferModal: React.FC<PriceOfferModalProps> = ({ isOpen, onClose, projectId, projectName, onChanged }) => {
  const { admin } = useAuth();
  const isOwner = admin?.role === 'Owner';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [template, setTemplate] = useState<PricingTemplate>('Einmalzahlung');
  const [totalPrice, setTotalPrice] = useState('');
  const [depositPercent, setDepositPercent] = useState(TEMPLATE_CONFIG.Hybrid.depositDefault!);
  const [surchargePercent, setSurchargePercent] = useState(TEMPLATE_CONFIG.Einmalzahlung.surchargeDefault);
  const [maintenanceFee, setMaintenanceFee] = useState('');
  const [termMonths, setTermMonths] = useState(0);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });

  const notify = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });
  const cfg = TEMPLATE_CONFIG[template];

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      offerService.getByProjectId(projectId)
        .then(o => {
          setOffer(o);
          setTemplate(o.pricingTemplate || 'Einmalzahlung');
          setTotalPrice(o.totalPrice != null ? String(o.totalPrice) : '');
          setDepositPercent(o.depositPercent ?? TEMPLATE_CONFIG.Hybrid.depositDefault!);
          setSurchargePercent(o.surchargePercent ?? TEMPLATE_CONFIG[o.pricingTemplate || 'Einmalzahlung'].surchargeDefault);
          setMaintenanceFee(o.maintenanceFee != null ? String(o.maintenanceFee) : '');
          setTermMonths(o.termMonths || TEMPLATE_CONFIG[o.pricingTemplate || 'Einmalzahlung'].termDefault);
        })
        .catch(() => notify('error', 'Angebot konnte nicht geladen werden.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId]);

  // Reset the template-specific fields to sensible defaults whenever the template changes.
  const handleTemplateChange = (next: PricingTemplate) => {
    setTemplate(next);
    const nextCfg = TEMPLATE_CONFIG[next];
    setSurchargePercent(nextCfg.surchargeDefault);
    if (next === 'Hybrid') setDepositPercent(nextCfg.depositDefault!);
    setTermMonths(nextCfg.termMonths === 'slider' ? nextCfg.termDefault : (nextCfg.termMonths as number));
  };

  const preview = useMemo(() => computeOfferPricing({
    template,
    totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
    depositPercent,
    surchargePercent,
    maintenanceFee: maintenanceFee ? parseFloat(maintenanceFee) : undefined,
    termMonths,
  }), [template, totalPrice, depositPercent, surchargePercent, maintenanceFee, termMonths]);

  const buildDto = () => ({
    pricingTemplate: template,
    totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
    depositPercent: cfg.hasDeposit ? depositPercent : undefined,
    surchargePercent: template === 'Einmalzahlung' ? undefined : surchargePercent,
    maintenanceFee: cfg.hasMaintenanceFee && maintenanceFee ? parseFloat(maintenanceFee) : undefined,
    termMonths,
  });

  const handleSaveDraft = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      const result = await offerService.saveDraft(projectId, buildDto());
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
      // (e.g. changing the Preismodell or den Preis) is never silently dropped.
      await offerService.saveDraft(projectId, buildDto());
      const result = await offerService.release(projectId);
      setOffer(result);
      notify('success', 'Preis an Kreavolut freigegeben.');
      onChanged?.();
    } catch {
      notify('error', 'Preis konnte nicht freigegeben werden. Bitte zuerst einen Projektpreis speichern.');
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
  const hybridTermIndex = Math.max(0, HYBRID_TERM_OPTIONS.indexOf(termMonths as typeof HYBRID_TERM_OPTIONS[number]));

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
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projektpreis (€)</Label>
                <Input type="number" min="0" step="0.01" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder="z.B. 8000" className="text-base font-semibold" />
              </div>

              {/* Template selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preismodell</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEMPLATE_ORDER.map(key => {
                    const opt = TEMPLATE_CONFIG[key];
                    const active = template === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTemplateChange(key)}
                        className={cn(
                          'text-left p-3 rounded-xl border transition-colors',
                          active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-secondary'
                        )}
                      >
                        <div className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>{opt.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hybrid: deposit % slider */}
              {cfg.hasDeposit && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Anzahlung</Label>
                    <span className="text-sm font-semibold text-foreground">{depositPercent.toFixed(1)} %</span>
                  </div>
                  <Slider
                    value={[depositPercent]}
                    min={cfg.depositRange![0]}
                    max={cfg.depositRange![1]}
                    step={0.5}
                    onValueChange={([v]) => setDepositPercent(v)}
                  />
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>{cfg.depositRange![0]} %</span>
                    <span>{cfg.depositRange![1]} %</span>
                  </div>
                </div>
              )}

              {/* Surcharge % slider (all except Einmalzahlung) */}
              {template !== 'Einmalzahlung' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Aufschlag {cfg.hasDeposit ? 'auf Restbetrag' : 'auf Projektpreis'}
                    </Label>
                    <span className="text-sm font-semibold text-foreground">{surchargePercent.toFixed(1)} %</span>
                  </div>
                  <Slider
                    value={[surchargePercent]}
                    min={cfg.surchargeRange[0]}
                    max={cfg.surchargeRange[1]}
                    step={0.5}
                    onValueChange={([v]) => setSurchargePercent(v)}
                  />
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>{cfg.surchargeRange[0]} %</span>
                    <span>{cfg.surchargeRange[1]} %</span>
                  </div>
                </div>
              )}

              {/* Laufzeit: slider for Hybrid, static label for Monatlich12/24 */}
              {cfg.termMonths === 'slider' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Laufzeit</Label>
                    <span className="text-sm font-semibold text-foreground">{termMonths} Monate</span>
                  </div>
                  <Slider
                    value={[hybridTermIndex]}
                    min={0}
                    max={HYBRID_TERM_OPTIONS.length - 1}
                    step={1}
                    onValueChange={([i]) => setTermMonths(HYBRID_TERM_OPTIONS[i])}
                  />
                  <div className="flex justify-between text-[11px] text-text-muted">
                    {HYBRID_TERM_OPTIONS.map(m => <span key={m}>{m}</span>)}
                  </div>
                </div>
              ) : template !== 'Einmalzahlung' && (
                <p className="text-xs text-muted-foreground">Laufzeit: <span className="font-semibold text-foreground">{termMonths} Monate</span> (Standard für dieses Modell)</p>
              )}

              {/* Optional monthly maintenance fee */}
              {cfg.hasMaintenanceFee && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monatliche Wartungspauschale (€, optional)</Label>
                  <Input type="number" min="0" step="0.01" value={maintenanceFee} onChange={e => setMaintenanceFee(e.target.value)} placeholder="z.B. 50" />
                </div>
              )}

              {/* Live preview */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Vorschau</p>
                {template === 'Einmalzahlung' ? (
                  <p className="text-sm text-foreground">Einmalig fällig: <span className="font-bold">{formatPrice(preview.upfrontAmount)}</span></p>
                ) : (
                  <>
                    {!!preview.upfrontAmount && (
                      <p className="text-sm text-foreground">Anzahlung jetzt: <span className="font-bold">{formatPrice(preview.upfrontAmount)}</span></p>
                    )}
                    <p className="text-sm text-foreground">
                      Danach monatlich: <span className="font-bold">{formatPrice(preview.monthlyPrice)}</span>
                      <span className="text-muted-foreground"> über {termMonths} Monate</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Gesamt zu zahlen: {formatPrice(preview.totalPayable)}</p>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Entwurf speichern
                </Button>
                <Button type="button" onClick={() => setConfirmRelease(true)} disabled={saving || !totalPrice}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />Preis freigeben
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preismodell</p>
                <p className="text-sm text-foreground mt-0.5">{offer ? TEMPLATE_CONFIG[offer.pricingTemplate]?.label ?? offer.pricingTemplate : '–'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {offer?.pricingTemplate === 'Einmalzahlung' ? 'Einmaliger Preis' : 'Anzahlung'}
                  </p>
                  <p className="text-sm text-foreground mt-0.5">{formatPrice(offer?.upfrontAmount)}</p>
                </div>
                {offer?.pricingTemplate !== 'Einmalzahlung' && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monatlicher Preis</p>
                    <p className="text-sm text-foreground mt-0.5">{formatPrice(offer?.monthlyPrice)} {offer && <span className="text-muted-foreground">(über {offer.termMonths} Monate)</span>}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {canRespond && (
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" className="text-error border-error/25 hover:bg-error-bg" onClick={() => handleRespond(false)} disabled={saving}>
                <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />Als abgelehnt markieren
              </Button>
              <Button type="button" className="bg-success hover:bg-success/90" onClick={() => handleRespond(true)} disabled={saving}>
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
