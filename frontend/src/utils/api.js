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
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

const api = {
    client,

    // Token helpers for backward compatibility
    getToken: () => localStorage.getItem('token') || localStorage.getItem('authToken') || null,
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