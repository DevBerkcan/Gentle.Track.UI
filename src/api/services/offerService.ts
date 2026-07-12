import apiClient from '../apiClient';
import type { Offer, UpsertOfferDto, PublicOffer, PricingTemplate } from '../../types';

export const offerService = {
  getByProjectId: async (projectId: number): Promise<Offer> => {
    const response = await apiClient.get<Offer>(`/Offers/project/${projectId}`);
    return response.data;
  },

  saveDraft: async (projectId: number, data: UpsertOfferDto): Promise<Offer> => {
    const response = await apiClient.put<Offer>(`/Offers/project/${projectId}`, data);
    return response.data;
  },

  release: async (projectId: number): Promise<Offer> => {
    const response = await apiClient.post<Offer>(`/Offers/project/${projectId}/release`);
    return response.data;
  },

  /** Admin manually records which option the customer chose (e.g. after a phone call). */
  accept: async (offerId: number, template: PricingTemplate): Promise<Offer> => {
    const response = await apiClient.post<Offer>(`/Offers/${offerId}/accept`, { template });
    return response.data;
  },

  /** Admin manually records that the customer declined all options. */
  reject: async (offerId: number): Promise<Offer> => {
    const response = await apiClient.post<Offer>(`/Offers/${offerId}/reject`);
    return response.data;
  },

  getPublicByToken: async (token: string): Promise<PublicOffer> => {
    const response = await apiClient.get<PublicOffer>(`/Offers/respond/${token}`);
    return response.data;
  },

  /** action: a PricingTemplate key to choose that option, or 'decline' to reject all four. */
  respond: async (token: string, action: PricingTemplate | 'decline'): Promise<PublicOffer> => {
    const response = await apiClient.post<PublicOffer>('/Offers/respond', { token, action });
    return response.data;
  },
};
