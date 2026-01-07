import api from './api';

export interface CostValue {
    id?: string; // Optional for new items
    label?: string;
    value: number;
    unit: string;
}

export interface Cost {
    id: string;
    cost_group_id: string;
    title: string;
    state?: string;   // e.g. SGR, KUL
    formula?: string; // e.g. "GFA * Rate"
    position?: number;
    values?: CostValue[]; // Nested Data
    created_at?: string;
    updated_at?: string;
}

export interface CostParams {
    project_id: string;
    cost_category_id: string;
    cost_group_id: string;
    get_all?: boolean;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
}

// Helper to build base URL
const buildUrl = (projectId: string, catId: string, groupId: string) => 
    `/project/projects/${projectId}/cost-categories/${catId}/cost-groups/${groupId}/costs`;

export const CostService = {
    getAll: async (params: CostParams) => {
        const { project_id, cost_category_id, cost_group_id, ...qs } = params;
        const url = buildUrl(project_id, cost_category_id, cost_group_id);
        const { data } = await api.get(url, { params: qs });
        return data;
    },

    create: async (
        projectId: string, catId: string, groupId: string, 
        payload: { title: string; state?: string; formula?: string; values?: {value: number, unit: string}[] }
    ) => {
        const url = buildUrl(projectId, catId, groupId);
        const { data } = await api.post(url, payload);
        return data;
    },

    update: async (
        projectId: string, catId: string, groupId: string, costId: string,
        payload: { title: string; state?: string; formula?: string; values?: {value: number, unit: string}[] }
    ) => {
        const url = `${buildUrl(projectId, catId, groupId)}/${costId}`;
        const { data } = await api.put(url, payload);
        return data;
    },

    delete: async (projectId: string, catId: string, groupId: string, costId: string) => {
        const url = `${buildUrl(projectId, catId, groupId)}/${costId}`;
        await api.delete(url);
    },

    reorder: async (projectId: string, catId: string, groupId: string, ids: string[]) => {
        const url = `${buildUrl(projectId, catId, groupId)}/reorder`;
        const { data } = await api.post(url, { ids });
        return data;
    }
};