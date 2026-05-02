/**
 * Centralised API client.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

type RequestOptions = { method?: string; body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (body: { name: string; email: string; password: string; role?: string }) =>
    request<{ success: boolean; message: string; data?: { devOtp?: string } }>('/auth/signup', { method: 'POST', body }),

  verifyOtp: (body: { email: string; otp: string }) =>
    request<{ success: boolean; data: { token: string; user: ApiUser } }>('/auth/verify-otp', { method: 'POST', body }),

  resendOtp: (body: { email: string }) =>
    request<{ success: boolean; message: string; data?: { devOtp?: string } }>('/auth/resend-otp', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; data: { token: string; user: ApiUser } }>('/auth/login', { method: 'POST', body }),

  me: () =>
    request<{ success: boolean; data: { user: ApiUser } }>('/auth/me'),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<ApiListResponse<ApiProject>>(`/projects${qs}`);
  },
  get: (id: string) =>
    request<{ success: boolean; data: { project: ApiProject } }>(`/projects/${id}`),
  create: (body: { title: string; description?: string }) =>
    request<{ success: boolean; data: { project: ApiProject } }>('/projects', { method: 'POST', body }),
  update: (id: string, body: { title?: string; description?: string }) =>
    request<{ success: boolean; data: { project: ApiProject } }>(`/projects/${id}`, { method: 'PUT', body }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/projects/${id}`, { method: 'DELETE' }),
  addMembers: (id: string, memberIds: string[]) =>
    request<{ success: boolean; data: { project: ApiProject } }>(`/projects/${id}/members`, {
      method: 'POST', body: { memberIds },
    }),
  removeMember: (id: string, memberId: string) =>
    request<{ success: boolean; data: { project: ApiProject } }>(`/projects/${id}/members/${memberId}`, {
      method: 'DELETE',
    }),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: { page?: number; limit?: number; status?: string; priority?: string; projectId?: string; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<ApiListResponse<ApiTask>>(`/tasks${qs}`);
  },
  get: (id: string) =>
    request<{ success: boolean; data: { task: ApiTask } }>(`/tasks/${id}`),
  create: (body: { title: string; description?: string; status?: string; priority?: string; dueDate?: string; assignedTo?: string; projectId: string }) =>
    request<{ success: boolean; data: { task: ApiTask } }>('/tasks', { method: 'POST', body }),
  update: (id: string, body: Partial<{ title: string; description: string; status: string; priority: string; dueDate: string; assignedTo: string | null }>) =>
    request<{ success: boolean; data: { task: ApiTask } }>(`/tasks/${id}`, { method: 'PUT', body }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/tasks/${id}`, { method: 'DELETE' }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; data: { users: ApiUser[] } }>(`/users${qs}`);
  },
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () =>
    request<{ success: boolean; data: { user: ApiUser; stats: { totalTasks: number; completedTasks: number; pendingTasks: number } } }>('/profile'),
  update: (body: { name?: string; email?: string; avatar?: string | null }) =>
    request<{ success: boolean; data: { user: ApiUser } }>('/profile', { method: 'PUT', body }),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/profile/password', { method: 'PUT', body }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => request<{ success: boolean; data: ApiDashboard }>('/dashboard'),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () =>
    request<{ success: boolean; data: { notifications: ApiNotification[]; unreadCount: number } }>('/notifications'),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),
  clearAll: () =>
    request<{ success: boolean }>('/notifications', { method: 'DELETE' }),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
  isVerified?: boolean;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProject {
  _id: string;
  title: string;
  description: string;
  createdBy: ApiUser;
  members: ApiUser[];
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTask {
  _id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string | null;
  assignedTo: ApiUser | null;
  projectId: ApiProject | { _id: string; title: string };
  createdBy: ApiUser;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDashboard {
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalProjects: number;
  };
  projects: Array<ApiProject & { progress: number }>;
  recentTasks: ApiTask[];
}

interface ApiListResponse<T> {
  success: boolean;
  data: { [key: string]: T[] };
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiNotification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
}
