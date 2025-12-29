import { GroupStatus } from '../enums'; // Ensure you have this Enum
import api from './api';

export interface Group {
    id: string;
    category_id: string;
    title: string;
    status: GroupStatus;
    description?: string;
    
    // Timestamps
    created_at?: string;
    updated_at?: string;
}

export interface GroupParams {
    // URL Parameters
    project_id: string;
    category_id: string;

    // Query Parameters
    page?: number;
    per_page?: number;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    get_all?: boolean;
}

// Helper: Generates nested URL
const buildUrl = (projectId: string, categoryId: string) => 
    `/project/projects/${projectId}/categories/${categoryId}/groups`;

export const GroupService = {
    /**
     * Fetch list of groups
     */
    getAll: async (params: GroupParams) => {
        const { project_id, category_id, ...queryParams } = params;
        const { data } = await api.get(buildUrl(project_id, category_id), { params: queryParams });
        return data; 
    },

    getById: async (projectId: string, categoryId: string, groupId: string) => {
        const { data } = await api.get(`${buildUrl(projectId, categoryId)}/${groupId}`);
        return data;
    },

    create: async (payload: Partial<Group> & { project_id: string, category_id: string }) => {
        const url = buildUrl(payload.project_id, payload.category_id);
        const { data } = await api.post(url, payload);
        return data;
    },

    update: async (projectId: string, categoryId: string, groupId: string, payload: Partial<Group>) => {
        const { data } = await api.put(`${buildUrl(projectId, categoryId)}/${groupId}`, payload);
        return data;
    },

    delete: async (projectId: string, categoryId: string, groupId: string) => {
        await api.delete(`${buildUrl(projectId, categoryId)}/${groupId}`);
    }
};