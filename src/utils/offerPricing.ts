// src/utils/offerPricing.ts
import type { PricingTemplate } from '../types';

export const HYBRID_TERM_OPTIONS = [6, 12, 18, 24, 36] as const;

export interface TemplateConfig {
  label: string;
  shortLabel: string;
  description: string;
  hasDeposit: boolean;
  depositRange?: [number, number];
  depositDefault?: number;
  surchargeRange: [number, number];
  surchargeDefault: number;
  termMonths: number | 'slider';
  termDefault: number;
}

export const TEMPLATE_CONFIG: Record<PricingTemplate, TemplateConfig> = {
  Einmalzahlung: {
    label: 'Einmalzahlung',
    shortLabel: 'Einmalig',
    description: '100 % Projektpreis · keine monatliche Zahlung · günstigste Variante',
    hasDeposit: false,
    surchargeRange: [0, 0],
    surchargeDefault: 0,
    termMonths: 0,
    termDefault: 0,
  },
  Hybrid: {
    label: 'Hybrid-Modell',
    shortLabel: 'Hybrid',
    description: 'Anzahlung · Rest in Raten · Laufzeit wählbar',
    hasDeposit: true,
    depositRange: [0, 40],
    depositDefault: 37.5,
    surchargeRange: [0, 20],
    surchargeDefault: 15,
    termMonths: 'slider',
    termDefault: 12,
  },
  Monatlich12: {
    label: 'Monatlich 12 Monate',
    shortLabel: 'Monatlich · 12',
    description: '0 € Anzahlung · voller Preis + Aufschlag über 12 Monate',
    hasDeposit: false,
    surchargeRange: [0, 30],
    surchargeDefault: 25,
    termMonths: 12,
    termDefault: 12,
  },
  Monatlich24: {
    label: 'Monatlich 24 Monate',
    shortLabel: 'Monatlich · 24',
    description: '0 € Anzahlung · voller Preis + Aufschlag über 24 Monate',
    hasDeposit: false,
    surchargeRange: [0, 50],
    surchargeDefault: 42.5,
    termMonths: 24,
    termDefault: 24,
  },
};

export interface OfferPricingInput {
  template: PricingTemplate;
  totalPrice: number | undefined;
  depositPercent?: number;
  surchargePercent?: number;
  termMonths: number;
}

export interface OfferPricingResult {
  upfrontAmount?: number;
  monthlyPrice?: number;
  /** Sum of everything the customer ends up paying (upfront + all installments). */
  totalPayable?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Mirrors OfferService.ComputeOption on the backend, for an instant client-side preview. */
export function computeOfferPricing(input: OfferPricingInput): OfferPricingResult {
  const { template, totalPrice, termMonths } = input;

  if (totalPrice == null || Number.isNaN(totalPrice)) return {};

  if (template === 'Einmalzahlung') {
    return { upfrontAmount: totalPrice, monthlyPrice: undefined, totalPayable: totalPrice };
  }

  if (template === 'Hybrid') {
    const depositPct = input.depositPercent ?? TEMPLATE_CONFIG.Hybrid.depositDefault!;
    const surchargePct = input.surchargePercent ?? TEMPLATE_CONFIG.Hybrid.surchargeDefault;
    const deposit = round2(totalPrice * depositPct / 100);
    const remaining = totalPrice - deposit;
    const remainingWithSurcharge = remaining * (1 + surchargePct / 100);
    const monthly = termMonths > 0 ? round2(remainingWithSurcharge / termMonths) : undefined;
    return {
      upfrontAmount: deposit,
      monthlyPrice: monthly,
      totalPayable: monthly != null ? round2(deposit + monthly * termMonths) : deposit,
    };
  }

  // Monatlich12 / Monatlich24
  const cfg = TEMPLATE_CONFIG[template];
  const surchargePct = input.surchargePercent ?? cfg.surchargeDefault;
  const totalWithSurcharge = totalPrice * (1 + surchargePct / 100);
  const monthly = termMonths > 0 ? round2(totalWithSurcharge / termMonths) : undefined;
  return {
    upfrontAmount: 0,
    monthlyPrice: monthly,
    totalPayable: monthly != null ? round2(monthly * termMonths) : undefined,
  };
}
