// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonDe from './locales/de/common.json';
import authDe from './locales/de/auth.json';
import layoutDe from './locales/de/layout.json';
import dashboardDe from './locales/de/dashboard.json';
import customersDe from './locales/de/customers.json';
import projectsDe from './locales/de/projects.json';
import phasesDe from './locales/de/phases.json';
import commentsDe from './locales/de/comments.json';
import adminsDe from './locales/de/admins.json';
import briefingDe from './locales/de/briefing.json';
import priceOfferDe from './locales/de/priceOffer.json';
import customerPortalDe from './locales/de/customerPortal.json';

import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import layoutEn from './locales/en/layout.json';
import dashboardEn from './locales/en/dashboard.json';
import customersEn from './locales/en/customers.json';
import projectsEn from './locales/en/projects.json';
import phasesEn from './locales/en/phases.json';
import commentsEn from './locales/en/comments.json';
import adminsEn from './locales/en/admins.json';
import briefingEn from './locales/en/briefing.json';
import priceOfferEn from './locales/en/priceOffer.json';
import customerPortalEn from './locales/en/customerPortal.json';

export const defaultNS = 'common';

export const resources = {
  de: {
    common: commonDe,
    auth: authDe,
    layout: layoutDe,
    dashboard: dashboardDe,
    customers: customersDe,
    projects: projectsDe,
    phases: phasesDe,
    comments: commentsDe,
    admins: adminsDe,
    briefing: briefingDe,
    priceOffer: priceOfferDe,
    customerPortal: customerPortalDe,
  },
  en: {
    common: commonEn,
    auth: authEn,
    layout: layoutEn,
    dashboard: dashboardEn,
    customers: customersEn,
    projects: projectsEn,
    phases: phasesEn,
    comments: commentsEn,
    admins: adminsEn,
    briefing: briefingEn,
    priceOffer: priceOfferEn,
    customerPortal: customerPortalEn,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
  });

export default i18n;
