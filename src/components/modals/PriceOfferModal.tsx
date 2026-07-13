// src/components/modals/PriceOfferModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import Badge from '../common/Badge';
import { offerService } from '../../api/services/offerService';
import { useAuth } from '../../contexts/AuthContext';
import type { Offer, OfferOption, PricingTemplate } from '../../types';
import { TEMPLATE_CONFIG, HYBRID_TERM_OPTIONS, computeOfferPricing } from '../../utils/offerPricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, Send, ThumbsDown, Check } from 'lucide-react';
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

const OptionSummary = ({ option }: { option: OfferOption }) => {
  const { t } = useTranslation('priceOffer');
  const cfg = TEMPLATE_CONFIG[option.template];
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-foreground">{t(cfg.label)}</div>
      {option.template === 'Einmalzahlung' ? (
        <p className="text-sm text-foreground">{t('oneTimeLabel')} <span className="font-bold">{formatPrice(option.upfrontAmount)}</span></p>
      ) : (
        <>
          {!!option.upfrontAmount && (
            <p className="text-xs text-muted-foreground">{t('depositAmountPrefix')} <span className="font-semibold text-foreground">{formatPrice(option.upfrontAmount)}</span></p>
          )}
          <p className="text-sm text-foreground">
            <span className="font-bold">{formatPrice(option.monthlyPrice)}</span>
            <span className="text-muted-foreground text-xs"> {t('perMonthOverTerm', { months: option.termMonths })}</span>
          </p>
        </>
      )}
      <p className="text-xs text-muted-foreground">{t('totalLabel', { total: formatPrice(option.totalPayable) })}</p>
    </div>
  );
};

export const PriceOfferModal: React.FC<PriceOfferModalProps> = ({ isOpen, onClose, projectId, projectName, onChanged }) => {
  const { t } = useTranslation('priceOffer');
  const { t: tc } = useTranslation('common');
  const { admin } = useAuth();
  const isOwner = admin?.role === 'Owner';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [totalPrice, setTotalPrice] = useState('');
  const [hybridDeposit, setHybridDeposit] = useState(TEMPLATE_CONFIG.Hybrid.depositDefault!);
  const [hybridSurcharge, setHybridSurcharge] = useState(TEMPLATE_CONFIG.Hybrid.surchargeDefault);
  const [hybridTerm, setHybridTerm] = useState(TEMPLATE_CONFIG.Hybrid.termDefault);
  const [m12Surcharge, setM12Surcharge] = useState(TEMPLATE_CONFIG.Monatlich12.surchargeDefault);
  const [m24Surcharge, setM24Surcharge] = useState(TEMPLATE_CONFIG.Monatlich24.surchargeDefault);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<PricingTemplate | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });

  const notify = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      offerService.getByProjectId(projectId)
        .then(o => {
          setOffer(o);
          setTotalPrice(o.totalPrice != null ? String(o.totalPrice) : '');
          setHybridDeposit(o.hybridDepositPercent ?? TEMPLATE_CONFIG.Hybrid.depositDefault!);
          setHybridSurcharge(o.hybridSurchargePercent ?? TEMPLATE_CONFIG.Hybrid.surchargeDefault);
          setHybridTerm(o.hybridTermMonths || TEMPLATE_CONFIG.Hybrid.termDefault);
          setM12Surcharge(o.monatlich12SurchargePercent ?? TEMPLATE_CONFIG.Monatlich12.surchargeDefault);
          setM24Surcharge(o.monatlich24SurchargePercent ?? TEMPLATE_CONFIG.Monatlich24.surchargeDefault);
        })
        .catch(() => notify('error', t('loadError')))
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId]);

  const parsedTotal = totalPrice ? parseFloat(totalPrice) : undefined;
  const hybridTermIndex = Math.max(0, HYBRID_TERM_OPTIONS.indexOf(hybridTerm as typeof HYBRID_TERM_OPTIONS[number]));

  const previewOptions = useMemo<OfferOption[]>(() => {
    const einmalzahlung = computeOfferPricing({ template: 'Einmalzahlung', totalPrice: parsedTotal, termMonths: 0 });
    const hybrid = computeOfferPricing({ template: 'Hybrid', totalPrice: parsedTotal, depositPercent: hybridDeposit, surchargePercent: hybridSurcharge, termMonths: hybridTerm });
    const m12 = computeOfferPricing({ template: 'Monatlich12', totalPrice: parsedTotal, surchargePercent: m12Surcharge, termMonths: 12 });
    const m24 = computeOfferPricing({ template: 'Monatlich24', totalPrice: parsedTotal, surchargePercent: m24Surcharge, termMonths: 24 });
    return [
      { template: 'Einmalzahlung', termMonths: 0, ...einmalzahlung },
      { template: 'Hybrid', termMonths: hybridTerm, depositPercent: hybridDeposit, surchargePercent: hybridSurcharge, ...hybrid },
      { template: 'Monatlich12', termMonths: 12, surchargePercent: m12Surcharge, ...m12 },
      { template: 'Monatlich24', termMonths: 24, surchargePercent: m24Surcharge, ...m24 },
    ];
  }, [parsedTotal, hybridDeposit, hybridSurcharge, hybridTerm, m12Surcharge, m24Surcharge]);

  const buildDto = () => ({
    totalPrice: parsedTotal,
    hybridDepositPercent: hybridDeposit,
    hybridSurchargePercent: hybridSurcharge,
    hybridTermMonths: hybridTerm,
    monatlich12SurchargePercent: m12Surcharge,
    monatlich24SurchargePercent: m24Surcharge,
  });

  const handleSaveDraft = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      const result = await offerService.saveDraft(projectId, buildDto());
      setOffer(result);
      notify('success', t('draftSavedSuccess'));
      onChanged?.();
    } catch (err: any) {
      notify('error', err.response?.data?.message || t('draftSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async () => {
    if (!projectId) return;
    setConfirmRelease(false);
    try {
      setSaving(true);
      // Persist the current form values first so an edit made just before releasing is never silently dropped.
      await offerService.saveDraft(projectId, buildDto());
      const result = await offerService.release(projectId);
      setOffer(result);
      notify('success', t('releaseSuccess'));
      onChanged?.();
    } catch (err: any) {
      notify('error', err.response?.data?.message || t('releaseError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChoose = async (template: PricingTemplate) => {
    if (!offer) return;
    setPendingChoice(null);
    try {
      setSaving(true);
      const result = await offerService.accept(offer.offerID, template);
      setOffer(result);
      notify('success', t('choiceRecordedSuccess', { label: t(TEMPLATE_CONFIG[template].label) }));
      onChanged?.();
    } catch (err: any) {
      notify('error', err.response?.data?.message || t('actionError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeclineAll = async () => {
    if (!offer) return;
    setConfirmDecline(false);
    try {
      setSaving(true);
      const result = await offerService.reject(offer.offerID);
      setOffer(result);
      notify('success', t('declineAllRecordedSuccess'));
      onChanged?.();
    } catch (err: any) {
      notify('error', err.response?.data?.message || t('actionError'));
    } finally {
      setSaving(false);
    }
  };

  const canEdit = isOwner && (!offer || offer.status === 'Entwurf' || offer.status === 'Abgelehnt' || offer.status === 'Freigegeben');
  const canRespond = offer?.status === 'Freigegeben';
  const isReEdit = offer?.status === 'Freigegeben';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('title', { projectName: projectName ?? '' })} size="lg">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">{t('loadingText')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {offer && <div><Badge status={offer.status} /></div>}

          {canEdit ? (
            <>
              {isReEdit && (
                <div className="flex items-center gap-2 text-xs bg-warning-bg border border-warning/25 text-[#9A6510] rounded-lg px-3 py-2">
                  {t('reEditNotice')}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {t('editIntro')}
              </p>

              <div className="space-y-1 max-w-xs">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('projectPriceLabel')}</Label>
                <Input type="number" min="0" step="0.01" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder={t('projectPricePlaceholder')} className="text-base font-semibold" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Einmalzahlung: fixed, just a preview */}
                <div className="rounded-xl border border-border p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">{t(TEMPLATE_CONFIG.Einmalzahlung.label)}</p>
                  <p className="text-xs text-muted-foreground">{t(TEMPLATE_CONFIG.Einmalzahlung.description)}</p>
                  <p className="text-lg font-bold text-foreground">{formatPrice(previewOptions[0].upfrontAmount)}</p>
                </div>

                {/* Hybrid: deposit + surcharge + term sliders */}
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(TEMPLATE_CONFIG.Hybrid.label)}</p>
                    <p className="text-xs text-muted-foreground">{t(TEMPLATE_CONFIG.Hybrid.description)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase">{t('depositLabel')}</Label>
                      <span className="text-xs font-semibold text-foreground">{hybridDeposit.toFixed(1)} %</span>
                    </div>
                    <Slider value={[hybridDeposit]} min={TEMPLATE_CONFIG.Hybrid.depositRange![0]} max={TEMPLATE_CONFIG.Hybrid.depositRange![1]} step={0.5} onValueChange={([v]) => setHybridDeposit(v)} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase">{t('hybridSurchargeLabel')}</Label>
                      <span className="text-xs font-semibold text-foreground">{hybridSurcharge.toFixed(1)} %</span>
                    </div>
                    <Slider value={[hybridSurcharge]} min={TEMPLATE_CONFIG.Hybrid.surchargeRange[0]} max={TEMPLATE_CONFIG.Hybrid.surchargeRange[1]} step={0.5} onValueChange={([v]) => setHybridSurcharge(v)} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase">{t('termLabel')}</Label>
                      <span className="text-xs font-semibold text-foreground">{t('monthsUnit', { count: hybridTerm })}</span>
                    </div>
                    <Slider value={[hybridTermIndex]} min={0} max={HYBRID_TERM_OPTIONS.length - 1} step={1} onValueChange={([i]) => setHybridTerm(HYBRID_TERM_OPTIONS[i])} />
                  </div>
                  <OptionSummary option={previewOptions[1]} />
                </div>

                {/* Monatlich12: surcharge slider */}
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(TEMPLATE_CONFIG.Monatlich12.label)}</p>
                    <p className="text-xs text-muted-foreground">{t(TEMPLATE_CONFIG.Monatlich12.description)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase">{t('surchargeLabel')}</Label>
                      <span className="text-xs font-semibold text-foreground">{m12Surcharge.toFixed(1)} %</span>
                    </div>
                    <Slider value={[m12Surcharge]} min={TEMPLATE_CONFIG.Monatlich12.surchargeRange[0]} max={TEMPLATE_CONFIG.Monatlich12.surchargeRange[1]} step={0.5} onValueChange={([v]) => setM12Surcharge(v)} />
                  </div>
                  <OptionSummary option={previewOptions[2]} />
                </div>

                {/* Monatlich24: surcharge slider */}
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(TEMPLATE_CONFIG.Monatlich24.label)}</p>
                    <p className="text-xs text-muted-foreground">{t(TEMPLATE_CONFIG.Monatlich24.description)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase">{t('surchargeLabel')}</Label>
                      <span className="text-xs font-semibold text-foreground">{m24Surcharge.toFixed(1)} %</span>
                    </div>
                    <Slider value={[m24Surcharge]} min={TEMPLATE_CONFIG.Monatlich24.surchargeRange[0]} max={TEMPLATE_CONFIG.Monatlich24.surchargeRange[1]} step={0.5} onValueChange={([v]) => setM24Surcharge(v)} />
                  </div>
                  <OptionSummary option={previewOptions[3]} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  {t('saveDraftButton')}
                </Button>
                <Button type="button" onClick={() => setConfirmRelease(true)} disabled={saving || !totalPrice}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />{t('releaseButton')}
                </Button>
              </div>
            </>
          ) : (
            <>
              {offer?.status === 'Angenommen' && (
                <div className="rounded-xl border border-success/25 bg-success-bg/60 p-4">
                  <p className="text-xs font-semibold text-[#15805A] uppercase tracking-wide mb-1">{t('chosenOptionLabel')}</p>
                  <OptionSummary option={{
                    template: offer.pricingTemplate,
                    upfrontAmount: offer.upfrontAmount,
                    monthlyPrice: offer.monthlyPrice,
                    termMonths: offer.termMonths,
                    totalPayable: undefined,
                  }} />
                </div>
              )}
              {offer?.status === 'Abgelehnt' && (
                <p className="text-sm text-muted-foreground">{t('declinedAllText')}</p>
              )}
              {offer?.status === 'Entwurf' && (
                <p className="text-sm text-muted-foreground">{t('draftNotSetText')}</p>
              )}
              {offer?.status === 'Freigegeben' && (
                <p className="text-sm text-muted-foreground">{t('releasedWaitingText')}</p>
              )}
            </>
          )}

          {canRespond && offer && (
            <div className="space-y-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('manualResponseIntro')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {offer.options.map(opt => (
                  <button
                    key={opt.template}
                    type="button"
                    onClick={() => setPendingChoice(opt.template)}
                    disabled={saving}
                    className={cn(
                      'text-left rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5',
                      'disabled:opacity-50 disabled:pointer-events-none'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <OptionSummary option={opt} />
                      <Check className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" className="text-error border-error/25 hover:bg-error-bg" onClick={() => setConfirmDecline(true)} disabled={saving}>
                  <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />{t('declineAllButton')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmRelease}
        title={t('releaseConfirmTitle')}
        message={isReEdit ? t('reReleaseConfirmMessage') : t('releaseConfirmMessage')}
        confirmText={t('releaseConfirmButton')}
        type="info"
        onConfirm={handleRelease}
        onCancel={() => setConfirmRelease(false)}
      />

      <ConfirmDialog
        isOpen={pendingChoice !== null}
        title={tc('confirmDialog.defaultTitle')}
        message={pendingChoice ? t('chooseConfirmMessage', { label: t(TEMPLATE_CONFIG[pendingChoice].label) }) : ''}
        confirmText={tc('actions.confirm')}
        type="info"
        onConfirm={() => pendingChoice && handleChoose(pendingChoice)}
        onCancel={() => setPendingChoice(null)}
      />

      <ConfirmDialog
        isOpen={confirmDecline}
        title={t('declineAllConfirmTitle')}
        message={t('declineAllConfirmMessage')}
        confirmText={t('declineConfirmButton')}
        type="danger"
        onConfirm={handleDeclineAll}
        onCancel={() => setConfirmDecline(false)}
      />

      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
    </Modal>
  );
};
