
// Base API response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Vote interface for API responses
export interface Vote {
  id: string;
  company_name: string;
  service_type: string;
  created_at: string;
  count: number;
}

// User interface
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  created_at: string;
}

// Company interface
export interface Company {
  id: string;
  name: string;
  description: string;
  created_at: string;
  analytics?: {
    totalVotes: number;
    votesPerDay: { date: string; count: number }[];
    satisfaction: number; // percentage
  };
}

// Service Type interface
export interface ServiceType {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// Monitor configuration
export interface MonitorConfig {
  refreshInterval: number; // in seconds
  displayMode: 'standard' | 'tv';
  highlightThreshold: number;
  showCompanies: boolean;
  showServices: boolean;
  showRecentVotes: boolean;
}
