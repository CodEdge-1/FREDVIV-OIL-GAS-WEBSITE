const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiError {
  message: string;
  statusCode: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: response.statusText,
      statusCode: response.status,
    }));
    throw error;
  }
  return response.json();
}

export const apiClient = {
  // Auth endpoints
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ access_token: string; user: any }>(response);
  },

  getMe: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse<any>(response);
  },

  // Users endpoints
  getUsers: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any[]>(response);
  },

  getUser: async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any>(response);
  },

  createUser: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  updateUser: async (token: string, id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  deleteUser: async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<void>(response);
  },

  // Branches endpoints
  getBranches: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/branches`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any[]>(response);
  },

  createBranch: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/branches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Sales Reports endpoints
  getSalesReports: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/sales-reports`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any[]>(response);
  },

  createSalesReport: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/sales-reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  submitSalesReport: async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/sales-reports/${id}/submit`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any>(response);
  },

  // Expenses endpoints
  getExpenses: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any[]>(response);
  },

  createExpense: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Transactions endpoints
  getTransactions: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any[]>(response);
  },

  // Fuel Prices endpoints
  getFuelPrices: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/fuel-prices/current`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return handleResponse<any>(response);
  },

  updateFuelPrices: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/fuel-prices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },
};
