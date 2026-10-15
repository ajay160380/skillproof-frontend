import { api } from './api';

export interface DashboardStats {
  overview: {
    total_organizations: number;
    active_organizations: number;
    total_departments: number;
    total_users: number;
    mis_score_avg: number;
  };
  users_breakdown: Record<string, number>;
  tasks_summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
    audited: number;
  };
  assessments_summary: {
    total_attempts: number;
    verified_count: number;
  };
  recent_activity: Array<{
    id: number;
    user_details?: {
      email: string;
      full_name: string;
    };
    action: string;
    target_model: string;
    target_id: string;
    details: any;
    timestamp: string;
  }>;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  description: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  status: 'active' | 'inactive' | 'pending';
  departments_count: number;
  members_count: number;
  tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  organization: number;
  organization_name?: string;
  name: string;
  code: string;
  description: string;
  manager?: number;
  manager_details?: {
    id: number;
    email: string;
    full_name: string;
  };
  status: 'active' | 'inactive';
  members_count: number;
  tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface OperationTask {
  id: number;
  title: string;
  description: string;
  task_type: 'adhoc' | 'recurring' | 'checklist' | 'workflow';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'audited';
  organization?: number;
  organization_name?: string;
  department?: number;
  department_name?: string;
  assigned_to?: number;
  assigned_to_details?: {
    id: number;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  created_by?: number;
  created_by_details?: {
    email: string;
    full_name: string;
  };
  audited_by_details?: {
    email: string;
    full_name: string;
  };
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  score: number;
  mis_score: number;
  checklist_data?: Array<{ title: string; completed: boolean }>;
  workflow_stages?: Array<{ stage_number: number; name: string; status: string; reviewer: string }>;
  additional_fields?: Array<{ label: string; field_type: string; value: string; is_mandatory: boolean }>;
  proof_submission?: string;
  audit_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  headline?: string;
  location?: string;
  company_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
  assigned_tasks_count: number;
}

export const operationsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/operations/dashboard/');
    return res.data;
  },

  getOrganizations: async (params?: any): Promise<Organization[]> => {
    const res = await api.get('/operations/organizations/', { params });
    return res.data?.results || res.data;
  },

  createOrganization: async (data: Partial<Organization>): Promise<Organization> => {
    const res = await api.post('/operations/organizations/', data);
    return res.data;
  },

  updateOrganization: async (id: number, data: Partial<Organization>): Promise<Organization> => {
    const res = await api.put(`/operations/organizations/${id}/`, data);
    return res.data;
  },

  deleteOrganization: async (id: number): Promise<void> => {
    await api.delete(`/operations/organizations/${id}/`);
  },

  getDepartments: async (params?: any): Promise<Department[]> => {
    const res = await api.get('/operations/departments/', { params });
    return res.data?.results || res.data;
  },

  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    const res = await api.post('/operations/departments/', data);
    return res.data;
  },

  updateDepartment: async (id: number, data: Partial<Department>): Promise<Department> => {
    const res = await api.put(`/operations/departments/${id}/`, data);
    return res.data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete(`/operations/departments/${id}/`);
  },

  getTasks: async (params?: any): Promise<OperationTask[]> => {
    const res = await api.get('/operations/tasks/', { params });
    return res.data?.results || res.data;
  },

  createTask: async (data: Partial<OperationTask>): Promise<OperationTask> => {
    const res = await api.post('/operations/tasks/', data);
    return res.data;
  },

  updateTask: async (id: number, data: Partial<OperationTask>): Promise<OperationTask> => {
    const res = await api.put(`/operations/tasks/${id}/`, data);
    return res.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/operations/tasks/${id}/`);
  },

  submitProof: async (id: number, data: { proof_submission: string; checklist_data?: any; workflow_stages?: any }): Promise<OperationTask> => {
    const res = await api.post(`/operations/tasks/${id}/submit-proof/`, data);
    return res.data;
  },

  auditTask: async (id: number, data: { action: 'approve' | 'reject'; audit_notes?: string; mis_score?: number }): Promise<OperationTask> => {
    const res = await api.post(`/operations/tasks/${id}/audit/`, data);
    return res.data;
  },

  getAdminUsers: async (params?: any): Promise<AdminUser[]> => {
    const res = await api.get('/operations/users/', { params });
    return res.data?.results || res.data;
  },

  toggleUserVerified: async (id: number): Promise<{ status: string; is_verified: boolean }> => {
    const res = await api.post(`/operations/users/${id}/toggle-verified/`);
    return res.data;
  },

  changeUserRole: async (id: number, role: string): Promise<{ status: string; role: string }> => {
    const res = await api.post(`/operations/users/${id}/change-role/`, { role });
    return res.data;
  },
};
