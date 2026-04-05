import api from './axios.js';

// Auth
export const registerUser = (data) => api.post('/auth/register', data).then((r) => r.data);
export const loginUser = (data) => api.post('/auth/login', data).then((r) => r.data);
export const refreshTokenApi = (refreshToken) =>
  api.post('/auth/refresh-token', { refreshToken }).then((r) => r.data);

// Products
export const fetchProducts = (params) => api.get('/products', { params }).then((r) => r.data);
export const fetchProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);
export const createProduct = (data) => api.post('/products', data).then((r) => r.data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);

// Sellers
export const onboardSeller = (data) => api.post('/sellers/onboard', data).then((r) => r.data);
export const fetchSellerProfile = (id) => api.get(`/sellers/${id}`).then((r) => r.data);
export const fetchDashboard = () => api.get('/sellers/me/dashboard').then((r) => r.data);
export const fetchSellerOrders = () => api.get('/sellers/me/orders').then((r) => r.data);

// Certifications
export const createCertification = (data) => api.post('/certifications', data).then((r) => r.data);
export const fetchCertification = (id) => api.get(`/certifications/${id}`).then((r) => r.data);
export const updateCertStatus = (id, status) =>
  api.patch(`/certifications/${id}/status`, { status }).then((r) => r.data);

// Orders
export const createOrder = (data) => api.post('/orders', data).then((r) => r.data);
export const fetchMyOrders = () => api.get('/orders/me').then((r) => r.data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);

// Addresses
export const fetchAddresses = () => api.get('/addresses').then((r) => r.data);
export const addAddress = (data) => api.post('/addresses', data).then((r) => r.data);
export const deleteAddress = (id) => api.delete(`/addresses/${id}`).then((r) => r.data);
