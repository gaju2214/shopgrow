import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
  timeout: 10000
});

// Add interceptor to include authorization token in all requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Auth token attached to request:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No auth token found in localStorage');
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
client.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    console.error('❌ 401 Unauthorized - Token may be invalid or expired');
  }
  return Promise.reject(error);
});

const api = {
  client,

  // Token helpers for backward compatibility
  getToken: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('Getting token:', token ? 'Found' : 'Not found');
    return token;
  },
  
  authHeaders: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Auth endpoints
  postLogin: (data) => client.post('/api/auth/login', data),

  register: (formData) =>
    client.post('/api/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Product endpoints
  getAllProducts: (params = {}) => client.get('/api/products', { params }),
  getProductById: (id) => client.get(`/api/products/${id}`),
  createProduct: (formData) => client.post('/api/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id, data) => client.put(`/api/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/api/products/${id}`),
  updateProductStock: (id, payload) => client.patch(`/api/products/${id}/stock`, payload),
  getLowStockProducts: () => client.get('/api/products/low-stock'),

  // Customer endpoints
  lookupCustomer: (mobileNumber) => client.get('/api/customers/lookup', {
    params: { mobile_number: mobileNumber }
  }),

  // Category endpoints
  createCategory: (data) => client.post('/api/categories', data),
  getAllCategories: () => client.get('/api/categories'),
  updateCategory: (id, data) => client.put(`/api/categories/${id}`, data),
  deleteCategory: (id) => client.delete(`/api/categories/${id}`),

  // Sales endpoints
  createSale: (data) => client.post('/api/sales', data),
  getSalesHistory: () => client.get('/api/sales/history'),
  getAllSales: () => client.get('/api/sales'),
  getSaleById: (id) => client.get(`/api/sales/${id}`),
};

export default api;
