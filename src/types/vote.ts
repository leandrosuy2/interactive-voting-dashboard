export interface Vote {
  id_voto: string;
  id_empresa: string;
  id_tipo_servico: string | null;
  avaliacao: 'Ótimo' | 'Bom' | 'Regular' | 'Ruim';
  comentario: string | null;
  status: boolean;
  momento_voto: string;
  updated_at: string;
}

export interface ServiceInfo {
  nome: string;
  tipo_servico: string;
  hora_inicio: string;
  hora_final: string;
}

export interface ServiceVotes {
  total: number;
  avaliacoes: {
    Ótimo: number;
    Bom: number;
    Regular: number;
    Ruim: number;
  };
  percentuais: {
    Ótimo: number;
    Bom: number;
    Regular: number;
    Ruim: number;
  };
  votes: Vote[];
  serviceInfo: ServiceInfo | null;
}

export interface VoteAnalytics {
  totalVotes: number;
  avaliacoesPorTipo: {
    Ótimo: number;
    Bom: number;
    Regular: number;
    Ruim: number;
  };
  percentuaisPorTipo: {
    Ótimo: number;
    Bom: number;
    Regular: number;
    Ruim: number;
  };
  votesByService: {
    [key: string]: ServiceVotes;
  };
  recentVotes: Vote[];
}

export interface ProcessedVote {
  id: string;
  companyName: string;
  serviceName: string;
  timestamp: string;
  count: number;
  isRecent: boolean;
}

export interface CompanyVoteAnalytics {
  companyId: string;
  companyName: string;
  totalVotes: number;
  serviceBreakdown: { service: string; count: number }[];
  votesTrend: { date: string; count: number }[];
  satisfaction: number; // percentage from 0-100
}
