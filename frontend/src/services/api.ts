const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.origin.includes('localhost:5173')
    ? 'http://localhost:8000/api'
    : '/api');

function getHeaders() {
  const token = localStorage.getItem('stocksense_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(formData: FormData): Promise<{ access_token: string; token_type: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData, // OAuth2PasswordRequestForm expects form-data
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async register(data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  // Dashboard Data
  async getDashboardData(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  // Ingestion
  async uploadCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = getHeaders();
    delete headers['Content-Type']; // Let browser set boundary automatically for multi-part

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Products
  async getProducts(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/products`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  // Sales
  async getSales(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/sales`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load sales');
    return res.json();
  },

  // Inventory
  async getInventory(filters: {
    category?: string;
    supplier?: string;
    warehouse?: string;
    low_stock?: boolean;
    search?: string;
  } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.supplier && filters.supplier !== 'All') params.append('supplier', filters.supplier);
    if (filters.warehouse && filters.warehouse !== 'All') params.append('warehouse', filters.warehouse);
    if (filters.low_stock) params.append('low_stock', 'true');
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE_URL}/inventory?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load inventory');
    return res.json();
  },

  // Demand Forecasting
  async trainForecastModel(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/train`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Model training failed');
    }
    return res.json();
  },

  async getForecast(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/forecast`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load forecasts');
    return res.json();
  },

  // Recommendations
  async getRecommendations(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/recommendations`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load recommendations');
    return res.json();
  },

  // Decision Simulator
  async simulateDecision(input: {
    product_id: number;
    reorder_quantity: number;
    holding_cost_override?: number;
    unit_cost_override?: number;
    selling_price_override?: number;
    lead_time_override?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Simulation calculation failed');
    }
    return res.json();
  },

  // AI Chat Assistant RAG
  async chat(message: string, history: any[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Failed to receive chat response');
    return res.json();
  }
};
