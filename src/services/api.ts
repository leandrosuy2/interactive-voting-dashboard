import axios from 'axios';
import { Vote, VoteAnalytics } from '../types/vote';
import { Company, CompanyService, CreateCompanyRequest, UpdateCompanyRequest, CreateCompanyServiceRequest } from '../types/company';
import { ServiceType, CreateServiceTypeRequest, UpdateServiceTypeRequest } from '../types/serviceType';
import { CreateUserRequest, UpdateUserRequest } from '../types/user';
import { Permission } from '../types/permission';

// Create an axios instance with base configurations
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
const api = axios.create({
  baseURL: API_URL,
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

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const auth = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (userData: { 
    username: string; 
    password: string; 
    email: string; 
    nome: string;
    cargo: string;
    perfil_acesso: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// Users APIs
export const users = {
  getAll: () => api.get('/users').then((response) => response.data),
  getById: (id: string) => api.get(`/users/${id}`).then((response) => response.data),
  getByUsername: (username: string) =>
    api.get(`/users/username/${username}`).then((response) => response.data),
  create: (data: CreateUserRequest) =>
    api.post('/users', data).then((response) => response.data),
  update: (id: string, data: UpdateUserRequest) =>
    api.put(`/users/${id}`, data).then((response) => response.data),
  delete: (id: string) => api.delete(`/users/${id}`).then((response) => response.data),
  getAccessProfiles: () => api.get('/users/access-profiles').then((response) => response.data),
  getPermissions: async (userId: string): Promise<Permission[]> => {
    const response = await api.get(`/users/${userId}/permissions`);
    return response.data;
  },
  updatePermission: async (userId: string, permission: string, has_permission: boolean) => {
    const response = await api.put(`/users/${userId}/permissions`, {
      permission,
      has_permission
    });
    return response.data;
  },
};

// Service Types APIs
export const serviceTypes = {
  create: async (data: CreateServiceTypeRequest): Promise<ServiceType> => {
    const response = await api.post('/service-types', data);
    return response.data;
  },
  getAll: async (): Promise<ServiceType[]> => {
    try {
      const response = await api.get('/service-types');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Falha ao buscar tipos de serviço');
      }
      throw error;
    }
  },
  getById: async (id: string): Promise<ServiceType> => {
    const response = await api.get(`/service-types/${id}`);
    return response.data;
  },
  update: async (id: string, data: UpdateServiceTypeRequest): Promise<ServiceType> => {
    const response = await api.patch(`/service-types/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/service-types/${id}`);
  },
};

// Companies APIs
export const companies = {
  getAll: async (): Promise<Company[]> => {
    const response = await api.get('/companies');
    return response.data;
  },

  getById: async (id: string): Promise<Company> => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  create: async (data: CreateCompanyRequest): Promise<Company> => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCompanyRequest): Promise<Company> => {
    const response = await api.patch(`/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },

  getLines: async (): Promise<{ value: number; label: string }[]> => {
    const response = await api.get('/companies/lines');
    return response.data;
  },

  updateLine: async (id: string, linha: number): Promise<Company> => {
    const response = await api.patch(`/companies/${id}`, { linha });
    return response.data;
  },

  getServices: async (id: string): Promise<CompanyService[]> => {
    const response = await api.get(`/companies/${id}/services`);
    return response.data;
  },

  addService: async (id: string, data: CreateCompanyServiceRequest): Promise<CompanyService> => {
    const response = await api.post(`/companies/${id}/services`, data);
    return response.data;
  },

  updateService: async (companyId: string, serviceId: string, data: Partial<CreateCompanyServiceRequest>): Promise<CompanyService> => {
    const response = await api.patch(`/companies/${companyId}/services/${serviceId}`, data);
    return response.data;
  },

  deleteService: async (companyId: string, serviceId: string): Promise<void> => {
    await api.delete(`/companies/${companyId}/services/${serviceId}`);
  }
};

// Votes APIs
export const votes = {
  create: async (data: { 
    id_empresa: string; 
    id_tipo_servico: string;
    avaliacao: string;
    comentario?: string;
  }) => {
    const response = await api.post('/votes', data);
    return response.data;
  },
  getAll: async (): Promise<Vote[]> => {
    try {
      const response = await api.get('/votes');
      const votes = response.data;
      
      // Busca os dados das empresas para cada voto
      const votesWithCompany = await Promise.all(
        votes.map(async (vote: Vote) => {
          try {
            const company = await companies.getById(vote.id_empresa);
            return { ...vote, company };
          } catch (error) {
            return vote;
          }
        })
      );
      
      return votesWithCompany;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Falha ao buscar votos');
      }
      throw error;
    }
  },
  getAnalytics: async (companyId: string): Promise<VoteAnalytics> => {
    const response = await api.get(`/votes/analytics/${companyId}`);
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
