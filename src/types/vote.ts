export interface Vote {
  id_voto: string;
  id_empresa: string;
  id_tipo_servico: string;
  avaliacao: string;
  comentario: string;
  status: boolean;
  momento_voto: string;
  serviceType: {
    id_tipo_servico: string;
    nome: string;
  };
}

export interface VoteAnalytics {
  totalVotes: number;
  avaliacoesPorTipo: {
    [key: string]: number;
  };
  percentuaisPorTipo: {
    [key: string]: number;
  };
  votesByService: {
    [key: string]: {
      total: number;
      avaliacoes: {
        [key: string]: number;
      };
      percentuais: {
        [key: string]: number;
      };
      votes: Vote[];
    };
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
