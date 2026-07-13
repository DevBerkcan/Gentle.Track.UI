// src/components/customer/OfferResponse.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { offerService } from '../../api/services/offerService';
import ConfirmDialog from '../common/ConfirmDialog';
import type { PublicOffer, OfferOption, PricingTemplate } from '../../types';
import { TEMPLATE_CONFIG } from '../../utils/offerPricing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ThumbsDown, CheckCircle2, XCircle, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatPrice = (value?: number) =>
  value == null ? '–' : value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

const OptionCard = ({ option, onChoose }: { option: OfferOption; onChoose?: () => void }) => {
  const { t } = useTranslation('customerPortal');
  const cfg = TEMPLATE_CONFIG[option.template];
  return (
    <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{t(cfg.label)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t(cfg.description)}</p>
      </div>
      <div className="space-y-0.5">
        {option.template === 'Einmalzahlung' ? (
          <p className="text-lg font-bold text-foreground">{formatPrice(option.upfrontAmount)}</p>
        ) : (
          <>
            {!!option.upfrontAmount && (
              <p className="text-xs text-muted-foreground">{t('offer.depositPrefix')} <span className="font-semibold text-foreground">{formatPrice(option.upfrontAmount)}</span></p>
            )}
            <p className="text-lg font-bold text-foreground">
              {formatPrice(option.monthlyPrice)} <span className="text-xs font-normal text-muted-foreground">{t('offer.perMonthSuffix')}</span>
            </p>
            <p className="text-xs text-muted-foreground">{t('offer.termSummary', { months: option.termMonths, total: formatPrice(option.totalPayable) })}</p>
          </>
        )}
      </div>
      {onChoose && (
        <Button type="button" variant="outline" className="mt-auto" onClick={onChoose}>
          <Check className="w-3.5 h-3.5 mr-1.5" />{t('offer.chooseThisOptionButton')}
        </Button>
      )}
    </div>
  );
};

const PRICING_TEMPLATES: PricingTemplate[] = ['Einmalzahlung', 'Hybrid', 'Monatlich12', 'Monatlich24'];

const OfferResponse = () => {
  const { t } = useTranslation('customerPortal');
  const { t: tc } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const chooseParam = searchParams.get('choose');

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<PricingTemplate | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('offer.invalidLink'));
      setLoading(false);
      return;
    }
    offerService.getPublicByToken(token)
      .then(o => {
        setOffer(o);
        // Coming from a per-option "choose this" link in the email: pre-open the matching
        // confirmation instead of making the customer hunt for the right card again.
        if (o.status === 'Freigegeben') {
          if (chooseParam === 'decline') setConfirmDecline(true);
          else if (chooseParam && PRICING_TEMPLATES.includes(chooseParam as PricingTemplate)) setPendingChoice(chooseParam as PricingTemplate);
        }
      })
      .catch(() => setError(t('offer.invalidOrExpiredLink')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRespond = async (action: PricingTemplate | 'decline') => {
    try {
      setResponding(true);
      const result = await offerService.respond(token, action);
      setOffer(result);
    } catch {
      setError(t('offer.respondError'));
    } finally {
      setResponding(false);
      setPendingChoice(null);
      setConfirmDecline(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">{t('offer.loadingText')}</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <Card className="border border-border shadow-sm max-w-xl">
        <CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-warning mx-auto" />
          <p className="text-sm text-muted-foreground">{error || t('offer.notFoundText')}</p>
        </CardContent>
      </Card>
    );
  }

  if (offer.status === 'Angenommen' || offer.status === 'Abgelehnt') {
    const accepted = offer.status === 'Angenommen';
    return (
      <Card className="border border-border shadow-sm max-w-xl">
        <CardContent className="p-8 text-center space-y-4">
          <div className={cn('w-14 h-14 rounded-full border-2 flex items-center justify-center mx-auto', accepted ? 'bg-success-bg border-success' : 'bg-error-bg border-error')}>
            {accepted ? <CheckCircle2 className="w-7 h-7 text-success" /> : <XCircle className="w-7 h-7 text-error" />}
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {accepted ? t('offer.acceptedHeading') : t('offer.declinedHeading')}
          </h2>
          <p className="text-sm text-muted-foreground">{offer.projectName}</p>
          {accepted && offer.pricingTemplate && (
            <div className="max-w-xs mx-auto pt-2">
              <OptionCard
                option={{
                  template: offer.pricingTemplate,
                  upfrontAmount: offer.upfrontAmount,
                  monthlyPrice: offer.monthlyPrice,
                  termMonths: offer.termMonths ?? 0,
                  totalPayable: undefined,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm max-w-3xl">
      <CardContent className="p-8 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('offer.pageTitle', { projectName: offer.projectName })}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('offer.chooseSubtitle', { price: formatPrice(offer.totalPrice) })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {offer.options.map(opt => (
            <OptionCard key={opt.template} option={opt} onChoose={() => setPendingChoice(opt.template)} />
          ))}
        </div>

        <div className="flex justify-center pt-4 border-t border-border">
          <Button type="button" variant="outline" className="text-error border-error/25 hover:bg-error-bg" onClick={() => setConfirmDecline(true)} disabled={responding}>
            <ThumbsDown className="w-4 h-4 mr-1.5" />{t('offer.declineAllButton')}
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        isOpen={pendingChoice !== null}
        title={t('offer.confirmOptionTitle')}
        message={pendingChoice ? t('offer.confirmOptionMessage', { label: t(TEMPLATE_CONFIG[pendingChoice].label) }) : ''}
        confirmText={tc('actions.confirm')}
        type="info"
        onConfirm={() => pendingChoice && handleRespond(pendingChoice)}
        onCancel={() => setPendingChoice(null)}
      />

      <ConfirmDialog
        isOpen={confirmDecline}
        title={t('offer.declineAllTitle')}
        message={t('offer.declineAllMessage')}
        confirmText={t('offer.declineConfirmButton')}
        type="danger"
        onConfirm={() => handleRespond('decline')}
        onCancel={() => setConfirmDecline(false)}
      />
    </Card>
  );
};

export default OfferResponse;
