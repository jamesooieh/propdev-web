import api from './api';
import { GroupStatus } from '../enums';
import { Category } from './category';

export interface Group {
    id: string;
    category_id: string;
    title: string;          // Matched to DB
    status: GroupStatus;    // Matched to Enum
    
    // Audit & Timestamps
    created_by?: string;
    approved_by?: string;
    created_at?: string;
    updated_at?: string;
    archived_at?: string | null;

    // Relationships
    category?: Category;
}

export interface GroupParams {
    category_id: string; // Required to fetch groups for a category
    get_all?: number;
}

const BASE_URL = '/project/groups'; // Adjust based on your actual route file prefix

export const GroupService = {
    getAll: async (params: GroupParams) => {
        const { data } = await api.get(BASE_URL, { params });
        return data; // Returns { data: Group[] }
    },
    create: async (payload: Partial<Group>) => {
        const { data } = await api.post(BASE_URL, payload);
        return data;
    },
    update: async (id: string, payload: Partial<Group>) => {
        const { data } = await api.put(`${BASE_URL}/${id}`, payload);
        return data;
    },
    delete: async (id: string) => {
        await api.delete(`${BASE_URL}/${id}`);
    }
};