import { Company } from './company';

export interface Permission {
  id: string;
  permission: string;
  has_permission: boolean;
  user_id: string;
}

export interface PermissionCategory {
  name: string;
  permissions: {
    key: string;
    label: string;
  }[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Menu Principal',
    permissions: [
      { key: 'dashboard', label: 'Dashboard' },
    ],
  },
  {
    name: 'Gestão',
    permissions: [
      { key: 'gestao', label: 'Gestão' },
      { key: 'cadastros', label: 'Cadastros' },
      { key: 'autorizacoes', label: 'Autorizações' },
    ],
  },
  {
    name: 'Níveis de Acesso',
    permissions: [
      { key: 'diretoria', label: 'Diretoria' },
      { key: 'gerente', label: 'Gerente' },
      { key: 'cliente', label: 'Cliente' },
    ],
  },
  {
    name: 'Pesquisas',
    permissions: [
      { key: 'pesquisas', label: 'Pesquisas' },
      { key: 'pesquisas_por_servico', label: 'Pesquisas por Serviço' },
    ],
  },
  {
    name: 'Relatórios',
    permissions: [
      { key: 'relatorios', label: 'Relatórios' },
      { key: 'relatorio_diario', label: 'Relatório Diário' },
      { key: 'relatorio_mensal', label: 'Relatório Mensal' },
    ],
  },
  {
    name: 'Outros',
    permissions: [
      { key: 'install_app_mobile', label: 'Install App Mobile' },
    ],
  },
];

export interface User {
  id: string;
  username: string;
  email: string;
  nome: string;
  cargo: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso: string;
  empresas: Company[];
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  nome: string;
  cargo: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso: string;
  empresas?: {
    id_empresa: string;
    nome_empresa: string;
    status: boolean;
  }[];
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  email?: string;
  nome?: string;
  cargo?: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso?: string;
  empresas?: {
    id_empresa: string;
    nome_empresa: string;
    status: boolean;
  }[];
}

export interface UserFormData {
  username: string;
  password: string;
  email: string;
  nome: string;
  cargo: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso: string;
  empresas: string[]; // IDs das empresas
}

export interface UserFormDataUpdate {
  username?: string;
  password?: string;
  email?: string;
  nome?: string;
  cargo?: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso?: string;
  empresas?: string[]; // IDs das empresas
}

export interface UserResponse {
  access_token: string;
  user: User;
}

export interface AccessProfile {
  value: string;
  label: string;
} 