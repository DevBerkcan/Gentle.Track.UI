import apiClient from '../apiClient';
import type { Briefing, UpsertBriefingDto } from '../../types';

export const briefingService = {
  getByTrackingNumber: async (trackingNumber: string): Promise<Briefing> => {
    const response = await apiClient.get<Briefing>(`/Briefing/tracking/${trackingNumber}`);
    return response.data;
  },

  saveDraft: async (trackingNumber: string, data: UpsertBriefingDto): Promise<Briefing> => {
    const response = await apiClient.put<Briefing>(`/Briefing/tracking/${trackingNumber}`, data);
    return response.data;
  },

  submit: async (trackingNumber: string, data: UpsertBriefingDto): Promise<Briefing> => {
    const response = await apiClient.post<Briefing>(`/Briefing/tracking/${trackingNumber}/submit`, data);
    return response.data;
  },

  getByProjectId: async (projectId: number): Promise<Briefing> => {
    const response = await apiClient.get<Briefing>(`/Briefing/project/${projectId}`);
    return response.data;
  },

  updateByProjectId: async (projectId: number, data: UpsertBriefingDto): Promise<Briefing> => {
    const response = await apiClient.put<Briefing>(`/Briefing/project/${projectId}`, data);
    return response.data;
  },
};
