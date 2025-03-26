import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { votes, companies } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Star, 
  Building2, 
  AlertTriangle, 
  Clock, 
  Activity,
  LineChart,
  BarChart3,
  Heart,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Bell,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, subHours, subDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import VoteFloatingBars from '@/components/VoteFloatingBars';
import VoteStats from '@/components/VoteStats';

interface Vote {
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

interface Analytics {
  totalVotes: number;
  averageRating: number;
  avaliacoesPorTipo: {
    [key: string]: number;
  };
  percentuaisPorTipo: {
    [key: string]: number;
  };
  votesByService: {
    [key: string]: {
      total: number;
      average: number;
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

interface Company {
  id: string;
  name: string;
}

type TimeRange = '1h' | '24h' | '7d' | '30d';

const Monitor: React.FC = () => {
  const { companyId: selectedCompanyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [alerts, setAlerts] = useState<Array<{
    type: 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
  }>>([]);

  // Query para buscar todas as empresas
  const { data: companiesList } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  // Query para buscar dados iniciais
  const { data: initialAnalytics, refetch } = useQuery({
    queryKey: ['analytics', selectedCompanyId],
    queryFn: async () => {
      if (selectedCompanyId) {
        const data = await votes.getAnalytics(selectedCompanyId);
        return {
          ...data,
          averageRating: calculateAverageRating(data.avaliacoesPorTipo),
          votesByService: Object.entries(data.votesByService).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: {
              ...value,
              average: calculateAverageRating(value.avaliacoes),
            },
          }), {}),
        };
      }
      
      // Se não houver empresa selecionada, buscar dados de todas as empresas
      const allCompanies = await companies.getAll();
      const allAnalytics = await Promise.all(
        allCompanies.map(company => votes.getAnalytics(company.id))
      );

      // Combinar os dados de todas as empresas
      const combinedAnalytics: Analytics = {
        totalVotes: 0,
        averageRating: 0,
        avaliacoesPorTipo: {},
        percentuaisPorTipo: {},
        votesByService: {},
        recentVotes: [],
      };

      allAnalytics.forEach(companyAnalytics => {
        // Somar total de votos
        combinedAnalytics.totalVotes += companyAnalytics.totalVotes;

        // Combinar avaliações por tipo
        Object.entries(companyAnalytics.avaliacoesPorTipo).forEach(([tipo, count]) => {
          combinedAnalytics.avaliacoesPorTipo[tipo] = (combinedAnalytics.avaliacoesPorTipo[tipo] || 0) + count;
        });

        // Combinar votos por serviço
        Object.entries(companyAnalytics.votesByService).forEach(([service, data]) => {
          if (!combinedAnalytics.votesByService[service]) {
            combinedAnalytics.votesByService[service] = {
              total: 0,
              average: 0,
              avaliacoes: {},
              percentuais: {},
              votes: [],
            };
          }
          combinedAnalytics.votesByService[service].total += data.total;
          
          // Combinar avaliações por tipo para cada serviço
          Object.entries(data.avaliacoes).forEach(([tipo, count]) => {
            combinedAnalytics.votesByService[service].avaliacoes[tipo] = 
              (combinedAnalytics.votesByService[service].avaliacoes[tipo] || 0) + count;
          });

          combinedAnalytics.votesByService[service].votes.push(...data.votes);
        });

        // Adicionar votos recentes
        combinedAnalytics.recentVotes.push(...companyAnalytics.recentVotes);
      });

      // Calcular médias e percentuais
      combinedAnalytics.averageRating = calculateAverageRating(combinedAnalytics.avaliacoesPorTipo);
      
      // Calcular percentuais por tipo
      Object.entries(combinedAnalytics.avaliacoesPorTipo).forEach(([tipo, count]) => {
        combinedAnalytics.percentuaisPorTipo[tipo] = (count / combinedAnalytics.totalVotes) * 100;
      });

      // Calcular médias e percentuais por serviço
      Object.keys(combinedAnalytics.votesByService).forEach(service => {
        const serviceData = combinedAnalytics.votesByService[service];
        serviceData.average = calculateAverageRating(serviceData.avaliacoes);
        
        // Calcular percentuais por tipo para cada serviço
        Object.entries(serviceData.avaliacoes).forEach(([tipo, count]) => {
          serviceData.percentuais[tipo] = (count / serviceData.total) * 100;
        });
      });

      // Ordenar votos recentes por data
      combinedAnalytics.recentVotes.sort((a, b) => 
        new Date(b.momento_voto).getTime() - new Date(a.momento_voto).getTime()
      );

      return combinedAnalytics;
    },
    enabled: true,
  });

  const calculateAverageRating = (avaliacoes: { [key: string]: number }) => {
    const ratingValues = {
      'Ótimo': 5,
      'Bom': 4,
      'Regular': 3,
      'Ruim': 2,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(avaliacoes).forEach(([tipo, count]) => {
      const value = ratingValues[tipo as keyof typeof ratingValues] || 0;
      weightedSum += value * count;
      totalWeight += count;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  useEffect(() => {
    if (initialAnalytics) {
      setAnalytics(initialAnalytics);
      checkAlerts(initialAnalytics);
    }
  }, [initialAnalytics]);

  // Configuração do WebSocket
  useEffect(() => {
    if (!selectedCompanyId) return;

    const newSocket = io('http://localhost:3005');
    setSocket(newSocket);

    newSocket.emit('joinCompanyRoom', selectedCompanyId);

    newSocket.on('voteUpdate', (updatedAnalytics: Analytics) => {
      setAnalytics(updatedAnalytics);
      checkAlerts(updatedAnalytics);
      toast({
        title: 'Novo voto recebido!',
        description: 'Os dados foram atualizados em tempo real.',
      });
    });
    
    return () => {
      newSocket.emit('leaveCompanyRoom', selectedCompanyId);
      newSocket.disconnect();
    };
  }, [selectedCompanyId, toast]);

  const checkAlerts = (data: Analytics) => {
    const newAlerts = [];

    // Verificar média geral
    if (data.averageRating < 3) {
      newAlerts.push({
        type: 'warning',
        message: `Média geral baixa: ${data.averageRating.toFixed(1)}`,
        timestamp: new Date(),
      });
    }

    // Verificar serviços individuais
    Object.entries(data.votesByService).forEach(([service, serviceData]) => {
      if (serviceData.average < 3) {
        newAlerts.push({
          type: 'warning',
          message: `Serviço "${service}" com média baixa: ${serviceData.average.toFixed(1)}`,
          timestamp: new Date(),
        });
      }
    });

    // Verificar tendência de queda
    if (data.recentVotes.length >= 2) {
      const lastVote = getRatingValue(data.recentVotes[0].avaliacao);
      const previousVote = getRatingValue(data.recentVotes[1].avaliacao);
      if (lastVote < previousVote && lastVote < 3) {
        newAlerts.push({
          type: 'error',
          message: `Tendência de queda detectada: ${previousVote.toFixed(1)} → ${lastVote.toFixed(1)}`,
          timestamp: new Date(),
        });
      }
    }

    setAlerts(newAlerts);
  };

  const handleCompanyChange = (companyId: string) => {
    if (companyId === 'all') {
      navigate('/monitor');
    } else {
      navigate(`/monitor/${companyId}`);
    }
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '1h':
        return 'Última hora';
      case '24h':
        return 'Últimas 24 horas';
      case '7d':
        return 'Últimos 7 dias';
      case '30d':
        return 'Últimos 30 dias';
    }
  };

  const getFilteredVotes = (votes: Vote[]) => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = subHours(now, 1);
        break;
      case '24h':
        startDate = subHours(now, 24);
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
    }

    return votes.filter((vote) =>
      isWithinInterval(new Date(vote.momento_voto), { start: startDate, end: now })
    );
  };

  const getRatingValue = (avaliacao: string): number => {
    switch (avaliacao) {
      case 'Ótimo':
        return 5;
      case 'Bom':
        return 4;
      case 'Regular':
        return 3;
      case 'Ruim':
        return 2;
      default:
        return 0;
    }
  };

  const getRatingColor = (avaliacao: string) => {
    switch (avaliacao) {
      case 'Ótimo':
        return 'text-green-500';
      case 'Bom':
        return 'text-blue-500';
      case 'Regular':
        return 'text-yellow-500';
      case 'Ruim':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRatingColorByValue = (value: number) => {
    if (value >= 4.5) return 'text-green-500';
    if (value >= 3.5) return 'text-blue-500';
    if (value >= 2.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingIcon = (avaliacao: string) => {
    switch (avaliacao) {
      case 'Ótimo':
        return <Heart className="h-4 w-4 fill-current" />;
      case 'Bom':
        return <ThumbsUp className="h-4 w-4" />;
      case 'Regular':
        return <Star className="h-4 w-4" />;
      case 'Ruim':
        return <ThumbsDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (!selectedCompanyId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Selecione uma empresa</h2>
            <p className="text-muted-foreground">
              Escolha uma empresa para monitorar em tempo real
            </p>
            <Select onValueChange={handleCompanyChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companiesList?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }
  
  if (!analytics) {
  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedCompany = companiesList?.find(
    (company) => company.id === selectedCompanyId
  );

  const filteredVotes = getFilteredVotes(analytics.recentVotes);
  const votesInRange = filteredVotes.length;
  const averageInRange = filteredVotes.reduce((acc, vote) => acc + getRatingValue(vote.avaliacao), 0) / (votesInRange || 1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Monitor</h1>
                <p className="text-muted-foreground">
                  {selectedCompanyId 
                    ? `Monitoramento de ${companiesList?.find(c => c.id === selectedCompanyId)?.nome}`
                    : 'Monitoramento Geral'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedCompanyId || 'all'}
              onValueChange={handleCompanyChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {companiesList?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {alerts.map((alert, index) => (
              <Alert 
                key={index} 
                variant={alert.type === 'error' ? 'destructive' : 'default'}
                className={cn(
                  "border-l-4",
                  alert.type === 'error' ? "border-red-500" : 
                  alert.type === 'warning' ? "border-yellow-500" : 
                  "border-green-500"
                )}
              >
                {alert.type === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                <AlertTitle>
                  {alert.type === 'error' ? 'Alerta Crítico' : alert.type === 'warning' ? 'Atenção' : 'Informação'}
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Status em tempo real */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Ativo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recebendo votos em tempo real
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votos no período</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{votesInRange}</div>
              <p className="text-xs text-muted-foreground">
                {getTimeRangeLabel(timeRange)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média no período</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageInRange.toFixed(1)}
              </div>
              <Progress
                value={(averageInRange / 5) * 100}
                className="mt-2 bg-yellow-100 dark:bg-yellow-900/20"
              />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tendência</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {averageInRange >= analytics.averageRating ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Crescendo
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    Diminuindo
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {Math.abs(averageInRange - analytics.averageRating).toFixed(1)} pontos
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Estatísticas de Votos */}
        <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Estatísticas de Votos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <VoteStats votes={filteredVotes} />
          </CardContent>
        </Card>

        {/* Votos recentes com indicadores */}
        <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Votos Recentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <VoteFloatingBars votes={filteredVotes} height={300} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitor;
