
export interface ProcessedVote {
  id: string;
  companyName: string;
  serviceName: string;
  timestamp: string;
  count: number;
  isRecent: boolean;
}

export interface VoteAnalytics {
  totalVotes: number;
  votesToday: number;
  votesThisWeek: number;
  averageVotesPerDay: number;
  topCompanies: { name: string; votes: number }[];
  topServices: { name: string; votes: number }[];
  votesByHour: { hour: number; count: number }[];
  votesByDay: { day: string; count: number }[];
}

export interface CompanyVoteAnalytics {
  companyId: string;
  companyName: string;
  totalVotes: number;
  serviceBreakdown: { service: string; count: number }[];
  votesTrend: { date: string; count: number }[];
  satisfaction: number; // percentage from 0-100
}
