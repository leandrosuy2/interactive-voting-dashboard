
import axios from 'axios';

// Create an axios instance with base configurations
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication APIs
export const auth = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (userData: { username: string; password: string; email: string; name: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// Users APIs
export const users = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  getByUsername: async (username: string) => {
    const response = await api.get(`/users/username/${username}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Service Types APIs
export const serviceTypes = {
  create: async (data: { name: string; description: string }) => {
    const response = await api.post('/service-types', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/service-types');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/service-types/${id}`);
    return response.data;
  },
  update: async (id: string, data: { name: string; description: string }) => {
    const response = await api.patch(`/service-types/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/service-types/${id}`);
    return response.data;
  },
};

// Companies APIs
export const companies = {
  create: async (data: { name: string; description: string }) => {
    const response = await api.post('/companies', data);
    return response.data;
  },
  addService: async (companyId: string, serviceTypeId: string) => {
    const response = await api.post(`/companies/${companyId}/services`, { serviceTypeId });
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/companies');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },
  getServices: async (id: string) => {
    const response = await api.get(`/companies/${id}/services`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
};

// Votes APIs
export const votes = {
  create: async (data: { id_empresa: string; id_tipo_servico: string }) => {
    const response = await api.post('/votes', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/votes');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/votes/${id}`);
    return response.data;
  },
  getByCompany: async (id_empresa: string) => {
    const response = await api.get(`/votes/empresa/${id_empresa}`);
    return response.data;
  },
  getByServiceType: async (id_tipo_servico: string) => {
    const response = await api.get(`/votes/servico/${id_tipo_servico}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/votes/${id}`);
    return response.data;
  },
};

export default api;
