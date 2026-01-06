import api from './api';

export interface CostCategory {
    id: string;
    project_id: string;
    title: string;
    groups_count?: number; // Optional count from backend
    created_at?: string;
    updated_at?: string;
}

export interface CostCategoryParams {
    project_id: string;
    page?: number;
    per_page?: number;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    get_all?: boolean;
}

const buildUrl = (projectId: string) => `/project/projects/${projectId}/cost-categories`;

export const CostCategoryService = {
    getAll: async (params: CostCategoryParams) => {
        const { project_id, ...queryParams } = params;
        const { data } = await api.get(buildUrl(project_id), { params: queryParams });
        return data; 
    },

    create: async (payload: { project_id: string; title: string }) => {
        const { data } = await api.post(buildUrl(payload.project_id), payload);
        return data;
    },

    update: async (projectId: string, id: string, payload: { title: string }) => {
        const { data } = await api.put(`${buildUrl(projectId)}/${id}`, payload);
        return data;
    },

    delete: async (projectId: string, id: string) => {
        await api.delete(`${buildUrl(projectId)}/${id}`);
    }
};