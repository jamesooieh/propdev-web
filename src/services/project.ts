import { ProjectStatus } from '../enums';
import api from './api';
import { Land } from './land'; // Import Land to type the relationship

export interface Project {
    id: string;
    developer_id?: string;
    title: string;
    status: ProjectStatus;
    
    // Permits / Reference Numbers
    asp_no?: string;
    do_no?: string;
    bpa_no?: string;

    // Relationships
    lands?: Land[];      // Read: The actual Land objects returned by API
    land_ids?: number[]; // Write: The IDs sent back to the API during create/update

    // Timestamps
    created_at?: string;
    updated_at?: string;
}

export interface ProjectParams {
    page: number;
    per_page: number;
    search?: string;
    sort: string;
    direction: 'asc' | 'desc';
    
    // Optional filters supported by your Controller
    status?: string;
    developer_id?: string;
}

// Full path based on your route definitions: 
// api.php (prefix 'project') -> project.php (prefix 'projects')
const BASE_URL = '/project/projects';

export const ProjectService = {
    /**
     * Fetch paginated list of projects
     */
    getAll: async (params: ProjectParams) => {
        const { data } = await api.get(BASE_URL, { params });
        return data; // Returns { data: Project[], meta: ... }
    },

    /**
     * Get a single project by ID (includes 'lands' relation)
     */
    getById: async (id: string) => {
        const { data } = await api.get(`${BASE_URL}/${id}`);
        return data;
    },

    /**
     * Create a new project
     */
    create: async (payload: Partial<Project>) => {
        const { data } = await api.post(BASE_URL, payload);
        return data;
    },

    /**
     * Update an existing project
     */
    update: async (id: string, payload: Partial<Project>) => {
        const { data } = await api.put(`${BASE_URL}/${id}`, payload);
        return data;
    },

    /**
     * Delete a project
     */
    delete: async (id: string) => {
        await api.delete(`${BASE_URL}/${id}`);
    }
};