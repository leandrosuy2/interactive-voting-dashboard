export interface Company {
  id: string;
  name: string;
  nome: string;
  razao_social: string;
  cnpj: string;
  email: string;
  telcom: string;
  telcel: string;
  qt_funcionarios: number;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  user_add: string;
  user_edt: string;
  linha: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyService {
  id: string;
  company_id: string;
  tipo_servico: string;
  nome: string;
  hora_inicio: string;
  hora_final: string;
  user_add: string;
  created_at: string;
}

export interface CreateCompanyRequest {
  nome: string;
  razao_social: string;
  cnpj: string;
  email: string;
  telcom: string;
  telcel: string;
  qt_funcionarios: number;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  user_add: string;
  linha: number;
}

export interface UpdateCompanyRequest {
  nome?: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telcom?: string;
  telcel?: string;
  qt_funcionarios?: number;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  user_edt: string;
  linha?: number;
}

export interface CreateCompanyServiceRequest {
  tipo_servico: string;
  nome: string;
  hora_inicio: string;
  hora_final: string;
  user_add: string;
} 