
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { votes, companies, serviceTypes } from '@/services/api';
import VoteCard from './VoteCard';
import { CircleAlert } from 'lucide-react';

interface Vote {
  id: string;
  id_empresa: string;
  id_tipo_servico: string;
  created_at: string;
}

interface ProcessedVote {
  id: string;
  companyName: string;
  serviceName: string;
  timestamp: string;
  count: number;
  isRecent: boolean;
}

const RealTimeVotes: React.FC = () => {
  const [processedVotes, setProcessedVotes] = useState<ProcessedVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to process votes with company and service type names
  const processVotesData = async () => {
    try {
      setLoading(true);
      
      // Get all votes, companies, and service types
      const [votesResponse, companiesResponse, serviceTypesResponse] = await Promise.all([
        votes.getAll(),
        companies.getAll(),
        serviceTypes.getAll()
      ]);

      // Create maps for quick lookup
      const companiesMap = new Map(companiesResponse.map((company: any) => [company.id, company.name]));
      const serviceTypesMap = new Map(serviceTypesResponse.map((service: any) => [service.id, service.name]));
      
      // Group votes by company and service type
      const voteGroups = votesResponse.reduce((acc: any, vote: Vote) => {
        const key = `${vote.id_empresa}_${vote.id_tipo_servico}`;
        if (!acc[key]) {
          acc[key] = {
            id: vote.id,
            id_empresa: vote.id_empresa,
            id_tipo_servico: vote.id_tipo_servico,
            count: 0,
            timestamps: []
          };
        }
        acc[key].count += 1;
        acc[key].timestamps.push(vote.created_at);
        return acc;
      }, {});
      
      // Convert to array and add company and service names
      const now = new Date();
      const processed = Object.values(voteGroups).map((group: any) => {
        // Sort timestamps to get the most recent one
        const sortedTimestamps = [...group.timestamps].sort((a, b) => 
          new Date(b).getTime() - new Date(a).getTime()
        );
        
        // Check if the vote is recent (less than 5 minutes ago)
        const mostRecentTime = new Date(sortedTimestamps[0]);
        const isRecent = (now.getTime() - mostRecentTime.getTime()) < 5 * 60 * 1000;
        
        return {
          id: group.id,
          companyName: companiesMap.get(group.id_empresa) || 'Empresa Desconhecida',
          serviceName: serviceTypesMap.get(group.id_tipo_servico) || 'Serviço Desconhecido',
          timestamp: sortedTimestamps[0],
          count: group.count,
          isRecent
        };
      });
      
      // Sort by count and recent status
      const sortedVotes = processed.sort((a, b) => {
        if (a.isRecent && !b.isRecent) return -1;
        if (!a.isRecent && b.isRecent) return 1;
        return b.count - a.count;
      });
      
      setProcessedVotes(sortedVotes);
      setError(null);
    } catch (error) {
      console.error('Error fetching real-time votes:', error);
      setError('Não foi possível carregar os votos.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    processVotesData();
    
    // Poll for new votes every 10 seconds
    const intervalId = setInterval(processVotesData, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading && processedVotes.length === 0) {
    return (
      <Card className="glass-card h-full">
        <CardHeader>
          <CardTitle>Carregando votos em tempo real...</CardTitle>
          <CardDescription>Aguarde enquanto buscamos os dados mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mb-4"></div>
              <div className="h-2 w-24 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card h-full border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <CircleAlert className="h-5 w-5" />
            Erro ao carregar votos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
        <CardFooter>
          <button 
            onClick={processVotesData}
            className="text-sm text-primary underline"
          >
            Tentar novamente
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {processedVotes.slice(0, 6).map((vote) => (
        <VoteCard 
          key={vote.id}
          companyName={vote.companyName}
          serviceName={vote.serviceName}
          timestamp={vote.timestamp}
          count={vote.count}
          isRecent={vote.isRecent}
        />
      ))}
    </div>
  );
};

export default RealTimeVotes;
