import apiClient from '../apiClient';
import type { Offer, UpsertOfferDto, PublicOffer } from '../../types';

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

  accept: async (offerId: number): Promise<Offer> => {
    const response = await apiClient.post<Offer>(`/Offers/${offerId}/accept`);
    return response.data;
  },

  reject: async (offerId: number): Promise<Offer> => {
    const response = await apiClient.post<Offer>(`/Offers/${offerId}/reject`);
    return response.data;
  },

  getPublicByToken: async (token: string): Promise<PublicOffer> => {
    const response = await apiClient.get<PublicOffer>(`/Offers/respond/${token}`);
    return response.data;
  },

  respond: async (token: string, action: 'accept' | 'reject'): Promise<PublicOffer> => {
    const response = await apiClient.post<PublicOffer>('/Offers/respond', { token, action });
    return response.data;
  },
};
