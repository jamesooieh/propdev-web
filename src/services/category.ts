import api from './api';
import { CategoryStatus } from '../enums';
// import { Group } from './group'; // Import if you need Group interface later

export interface Category {
    id: string;
    project_id: string;
    title: string;
    status: CategoryStatus;
    groups_count?: number; // Useful for UI stats if your backend provides it
    created_at?: string;
    
    // Relationships
    groups?: any[]; 
}

// Helper to build the nested URL
const buildUrl = (projectId: string) => `/project/projects/${projectId}/categories`;

export const CategoryService = {
    getAll: async (params: { project_id: string, search?: string }) => {
        const { project_id, ...rest } = params;
        const { data } = await api.get(buildUrl(project_id), { params: rest });
        return data; // Expecting { data: Category[], meta: ... }
    },

    getById: async (projectId: string, categoryId: string) => {
        const { data } = await api.get(`${buildUrl(projectId)}/${categoryId}`);
        return data;
    },

    create: async (payload: { project_id: string, title: string, status: string }) => {
        const { data } = await api.post(buildUrl(payload.project_id), payload);
        return data;
    },

    update: async (projectId: string, categoryId: string, payload: any) => {
        const { data } = await api.put(`${buildUrl(projectId)}/${categoryId}`, payload);
        return data;
    },

    delete: async (projectId: string, categoryId: string) => {
        await api.delete(`${buildUrl(projectId)}/${categoryId}`);
    }
};