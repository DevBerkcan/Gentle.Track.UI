// src/components/customer/OfferResponse.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { offerService } from '../../api/services/offerService';
import type { PublicOffer } from '../../types';
import { TEMPLATE_CONFIG } from '../../utils/offerPricing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ThumbsUp, ThumbsDown, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const formatPrice = (value?: number) =>
  value == null ? '–' : value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

const OfferResponse = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const highlightAction = searchParams.get('action');

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Dieser Link ist ungültig.');
      setLoading(false);
      return;
    }
    offerService.getPublicByToken(token)
      .then(setOffer)
      .catch(() => setError('Dieser Link ist ungültig oder abgelaufen.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRespond = async (action: 'accept' | 'reject') => {
    try {
      setResponding(true);
      const result = await offerService.respond(token, action);
      setOffer(result);
    } catch {
      setError('Ihre Antwort konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Angebot wird geladen…</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <Card className="border border-border shadow-sm max-w-xl">
        <CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-warning mx-auto" />
          <p className="text-sm text-muted-foreground">{error || 'Angebot nicht gefunden.'}</p>
        </CardContent>
      </Card>
    );
  }

  if (offer.status === 'Angenommen' || offer.status === 'Abgelehnt') {
    const accepted = offer.status === 'Angenommen';
    return (
      <Card className="border border-border shadow-sm max-w-xl">
        <CardContent className="p-8 text-center space-y-4">
          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center mx-auto ${accepted ? 'bg-success-bg border-success' : 'bg-error-bg border-error'}`}>
            {accepted ? <CheckCircle2 className="w-7 h-7 text-success" /> : <XCircle className="w-7 h-7 text-error" />}
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Sie haben dieses Angebot bereits {accepted ? 'angenommen' : 'abgelehnt'}.
          </h2>
          <p className="text-sm text-muted-foreground">{offer.projectName}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm max-w-xl">
      <CardContent className="p-8 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Preisangebot – {offer.projectName}</h2>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preismodell</p>
          <p className="text-sm text-foreground mt-1">{TEMPLATE_CONFIG[offer.pricingTemplate]?.label ?? offer.pricingTemplate}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {offer.pricingTemplate === 'Einmalzahlung' ? 'Einmaliger Preis' : 'Anzahlung'}
            </p>
            <p className="text-lg font-semibold text-foreground mt-1">{formatPrice(offer.upfrontAmount)}</p>
          </div>
          {offer.pricingTemplate !== 'Einmalzahlung' && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monatlicher Preis</p>
              <p className="text-lg font-semibold text-foreground mt-1">{formatPrice(offer.monthlyPrice)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">über {offer.termMonths} Monate</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className={`text-error border-error/25 hover:bg-error-bg ${highlightAction === 'reject' ? 'ring-2 ring-error/30' : ''}`}
            onClick={() => handleRespond('reject')}
            disabled={responding}
          >
            {responding ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ThumbsDown className="w-4 h-4 mr-1.5" />}
            Angebot ablehnen
          </Button>
          <Button
            type="button"
            className={`bg-success hover:bg-success/90 ${highlightAction === 'accept' ? 'ring-2 ring-success/30' : ''}`}
            onClick={() => handleRespond('accept')}
            disabled={responding}
          >
            {responding ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ThumbsUp className="w-4 h-4 mr-1.5" />}
            Angebot annehmen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferResponse;
