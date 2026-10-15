const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generic request helper with robust error parsing
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    // Check if response is CSV or file
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      return res.blob();
    }

    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || `HTTP ${res.status}: ${res.statusText}` };
      }
    }

    if (!res.ok) {
      throw new Error(data.message || 'An unexpected error occurred');
    }
    return data;
  } catch (err) {
    throw err;
  }
};

export const api = {
  // Tasks
  getTasks: (queryString = '') => {
    const q = queryString.startsWith('?') ? queryString : `?${queryString}`;
    return request(`/tasks${q}`);
  },
  getTaskById: (id) => request(`/tasks/${id}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  exportTasksCSV: async (queryString = '') => {
    const q = queryString.startsWith('?') ? queryString : `?${queryString}`;
    const url = `${API_BASE}/tasks/export/csv${q}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to export CSV');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Employees
  getEmployees: (queryString = '') => {
    const q = queryString.startsWith('?') ? queryString : `?${queryString}`;
    return request(`/employees${q}`);
  },
  getEmployeeById: (id) => request(`/employees/${id}`),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats')
};

export default api;
