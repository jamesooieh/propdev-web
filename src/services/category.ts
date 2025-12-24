import api from './api';
import { CategoryStatus } from '../enums';
import { Group } from './group';

export interface Category {
    id: string;
    project_id: string;
    title: string;          // Matched to DB
    status: CategoryStatus; // Matched to Enum
    
    // Audit & Timestamps
    created_by?: string;
    approved_by?: string;
    created_at?: string;
    updated_at?: string;
    archived_at?: string | null;

    // Relationships
    groups?: Group[]; 
}

export interface CategoryParams {
    project_id: string; // Required to fetch categories for a project
    get_all?: number;   // Optional flag if you want un-paginated lists
}

const BASE_URL = '/project/categories'; // Adjust based on your actual route file prefix

export const CategoryService = {
    getAll: async (params: CategoryParams) => {
        const { data } = await api.get(BASE_URL, { params });
        return data; // Returns { data: Category[] }
    },
    create: async (payload: Partial<Category>) => {
        const { data } = await api.post(BASE_URL, payload);
        return data;
    },
    update: async (id: string, payload: Partial<Category>) => {
        const { data } = await api.put(`${BASE_URL}/${id}`, payload);
        return data;
    },
    delete: async (id: string) => {
        await api.delete(`${BASE_URL}/${id}`);
    }
};