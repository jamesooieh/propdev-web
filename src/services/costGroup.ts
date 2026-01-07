import api from './api';

// --- Types ---

export interface CostGroup {
    id: string;
    cost_category_id: string;
    title: string;
    position?: number;
    costs_count?: number; // Optional count from backend
    created_at?: string;
    updated_at?: string;
}

// --- Params Interfaces ---

export interface CostGroupParams {
    project_id: string;
    cost_category_id: string;
    page?: number;
    per_page?: number;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    get_all?: boolean;
}

// --- API Services ---

const buildUrl = (projectId: string, costCategoryId: string) => 
    `/project/projects/${projectId}/cost-categories/${costCategoryId}/cost-groups`;

export const CostGroupService = {
    // Note: I renamed 'getAll' to 'getGroups' in the component, 
    // but typically 'getAll' is consistent. I'll map it to the usage you need.
    
    getGroups: async (params: CostGroupParams) => {
        const { project_id, cost_category_id, ...queryParams } = params;
        const { data } = await api.get(buildUrl(project_id, cost_category_id), { params: queryParams });
        return data;
    },

    createGroup: async (payload: { project_id: string; cost_category_id: string; title: string }) => {
        const { project_id, cost_category_id, ...dataPayload } = payload;
        const { data } = await api.post(buildUrl(project_id, cost_category_id), dataPayload);
        return data;
    },

    updateGroup: async (projectId: string, costCategoryId: string, groupId: string, payload: { title: string }) => {
        const url = `${buildUrl(projectId, costCategoryId)}/${groupId}`;
        const { data } = await api.put(url, payload);
        return data;
    },

    reorderGroups: async (projectId: string, costCategoryId: string, ids: string[]) => {
        const url = `/project/projects/${projectId}/cost-categories/${costCategoryId}/cost-groups/reorder`;
        const { data } = await api.post(url, { ids });
        return data;
    },

    deleteGroup: async (projectId: string, costCategoryId: string, groupId: string) => {
        const url = `${buildUrl(projectId, costCategoryId)}/${groupId}`;
        await api.delete(url);
    }
};