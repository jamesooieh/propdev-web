import { LandStatus, LandTenureType } from '../enums';
import api from './api'; // Your axios instance

export interface Land {
    id: string;
    developer_id: string;
    status: LandStatus;
    lot: string;
    sheet?: string;
    section?: string;
    town: string;
    district?: string;
    state: string; // Enum value
    tenure_type: LandTenureType;
    lease_duration?: number;
    lease_expiry?: number;
    expressed_condition?: string;
    implied_condition?: string;
    zoning?: string;
    density?: string;
    plot_ratio?: string;
    development_class?: string;
    development_type?: string;
}

export interface LandParams {
    page: number;
    per_page: number;
    search?: string;
    sort: string;
    direction: 'asc' | 'desc';
}

// Full path based on your route prefixes: /api/developer/developers
const BASE_URL = '/land/lands'; 

export const LandService = {
    getAll: async (params: LandParams) => {
        const { data } = await api.get(BASE_URL, { params });
        return data; // Expecting { data: Land[], meta: ... }
    },
    getById: async (id: string) => {
        const { data } = await api.get(`${BASE_URL}/${id}`);
        return data;
    },
    create: async (payload: any) => {
        const { data } = await api.post(BASE_URL, payload);
        return data;
    },
    update: async (id: string, payload: any) => {
        const { data } = await api.put(`${BASE_URL}/${id}`, payload);
        return data;
    },
    delete: async (id: string) => {
        await api.delete(`${BASE_URL}/${id}`);
    }
};