import { CategoryStatus } from '../enums';
import api from './api';
// import { Group } from './group'; // Reserved for when you implement Group interface

export interface Category {
    id: string;
    project_id: string;
    title: string;
    status: CategoryStatus;
    
    // UI Helpers / Aggregates
    groups_count?: number; 

    // Relationships
    groups?: any[]; // Replace with Group[] once defined

    // Timestamps
    created_at?: string;
    updated_at?: string;
}

export interface CategoryParams {
    // Mandatory for building the route URL
    project_id: string;

    // Standard Pagination & Filtering
    page?: number;      // Optional because we might want "all" for dropdowns
    per_page?: number;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    status?: CategoryStatus;
    get_all?: 1 | 0 | boolean;
}

// Helper: Generates the nested route URL based on Project ID
const buildUrl = (projectId: string) => `/project/projects/${projectId}/categories`;

export const CategoryService = {
    /**
     * Fetch paginated list of categories for a specific project.
     * Extracts 'project_id' to build the URL, sends the rest as query params.
     */
    getAll: async (params: CategoryParams) => {
        const { project_id, ...queryParams } = params;
        // GET /project/projects/{project_id}/categories?page=1&...
        const { data } = await api.get(buildUrl(project_id), { params: queryParams });
        return data; // Returns { data: Category[], meta: ... }
    },

    /**
     * Get a single category by ID
     */
    getById: async (projectId: string, categoryId: string) => {
        const { data } = await api.get(`${buildUrl(projectId)}/${categoryId}`);
        return data;
    },

    /**
     * Create a new category.
     * Requires project_id in payload to construct the URL.
     */
    create: async (payload: Partial<Category> & { project_id: string }) => {
        // URL: /project/projects/{project_id}/categories
        const url = buildUrl(payload.project_id);
        const { data } = await api.post(url, payload);
        return data;
    },

    /**
     * Update an existing category.
     */
    update: async (projectId: string, categoryId: string, payload: Partial<Category>) => {
        const { data } = await api.put(`${buildUrl(projectId)}/${categoryId}`, payload);
        return data;
    },

    /**
     * Delete a category.
     */
    delete: async (projectId: string, categoryId: string) => {
        await api.delete(`${buildUrl(projectId)}/${categoryId}`);
    }
};