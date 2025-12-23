import api from './api';
import { DeveloperStatus, Country } from '../enums';

export interface Developer {
    id: string;
    name: string;
    status: DeveloperStatus; // 'A' or 'X'
    reg_no?: string;
    license_no?: string;
    contact_person?: string;
    email?: string;
    phone_mobile?: string;
    phone_office?: string;
    phone_other?: string;
    street_l1?: string;
    street_l2?: string;
    street_l3?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: Country; // 'MY' or 'SG'
    created_at?: string;
}

export interface DeveloperParams {
    page?: number;
    per_page?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
    search?: string;
    get_all?: 1 | 0 | boolean;
}

// Full path based on your route prefixes: /api/developer/developers
const BASE_URL = '/developer/developers'; 

export const DeveloperService = {
    
    getAll: async (params?: DeveloperParams) => {
        const response = await api.get(BASE_URL, { params });
        // If get_all=1, response.data will be { data: Developer[] } without meta.
        // If paginated, response.data will be { data: Developer[], meta: {...} }
        return response.data; 
    },

    getById: async (id: string) => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data.data;
    },

    create: async (data: any) => {
        return api.post(BASE_URL, data);
    },

    update: async (id: string, data: any) => {
        return api.put(`${BASE_URL}/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete(`${BASE_URL}/${id}`);
    }
};