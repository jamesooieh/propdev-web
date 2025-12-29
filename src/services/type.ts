import api from './api';
import { Group } from './group';

export interface TypeDiscount {
    id?: string;
    title: string;
    rate_percent?: number;
    amount?: number;
}

export interface Type {
    id: string;
    group_id: string;
    title: string;
    status: 'A' | 'I';
    
    // Inputs
    lot_size_sqft?: number;
    lot_dimension_text?: string;
    unit_count?: number;
    built_up_sqft?: number;
    price_psf?: number;

    // Computations (Read-only from Backend)
    total_land_size?: number;
    total_built_up?: number;
    gross_gdv?: number;
    net_gdv?: number;
    units_per_acre?: number;
    sellable_land_area_pct?: number;

    created_at?: string;
    updated_at?: string;
    
    // Relationships
    discounts?: TypeDiscount[];
}

export interface TypeParams {
    project_id: string;
    category_id: string;
    group_id: string;
    
    page?: number;
    per_page?: number;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    get_all?: boolean;
}

// Helper: Generates nested URL
// /project/projects/{pid}/categories/{cid}/groups/{gid}/types
const buildUrl = (pId: string, cId: string, gId: string) => 
    `/project/projects/${pId}/categories/${cId}/groups/${gId}/types`;

export const TypeService = {
    getAll: async (params: TypeParams) => {
        const { project_id, category_id, group_id, ...queryParams } = params;
        const { data } = await api.get(buildUrl(project_id, category_id, group_id), { params: queryParams });
        return data; 
    },

    getById: async (pId: string, cId: string, gId: string, id: string) => {
        const { data } = await api.get(`${buildUrl(pId, cId, gId)}/${id}`);
        return data;
    },

    create: async (payload: Partial<Type> & { project_id: string, category_id: string, group_id: string }) => {
        const url = buildUrl(payload.project_id, payload.category_id, payload.group_id);
        const { data } = await api.post(url, payload);
        return data;
    },

    update: async (pId: string, cId: string, gId: string, id: string, payload: Partial<Type>) => {
        const { data } = await api.put(`${buildUrl(pId, cId, gId)}/${id}`, payload);
        return data;
    },

    delete: async (pId: string, cId: string, gId: string, id: string) => {
        await api.delete(`${buildUrl(pId, cId, gId)}/${id}`);
    }
};