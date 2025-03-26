import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companies, serviceTypes, votes } from '@/services/api';
import VoteChart from '@/components/VoteChart';
import RealTimeVotes from '@/components/RealTimeVotes';
import RecentVotes from '@/components/RecentVotes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart,
  Building,
  Users,
  Zap,
  LineChart,
  Activity,
  PieChart,
  Monitor as MonitorIcon,
  Building2,
  Wrench
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { Vote } from '@/types/vote';
import { Company } from '@/types/company';
import { ServiceType } from '@/types/serviceType';
import VoteCharts from '@/components/VoteCharts';
import { NewsTicker } from '@/components/NewsTicker';

interface CompanyVotes {
  name: string;
  votes: number;
  id: string;
}

interface ServiceTypeVotes {
  name: string;
  votes: number;
  id: string;
}

const Dashboard: React.FC = () => {
  const [companyVotes, setCompanyVotes] = useState<CompanyVotes[]>([]);
  const [serviceTypeVotes, setServiceTypeVotes] = useState<ServiceTypeVotes[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const [totalServiceTypes, setTotalServiceTypes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [allVotes, setAllVotes] = useState<Vote[]>([]);
  const [votesData, setVotesData] = useState<{ today: number, week: number, month: number }>({
    today: 0,
    week: 0,
    month: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all required data
      const [allVotes, allCompanies, allServiceTypes] = await Promise.all([
        votes.getAll(),
        companies.getAll(),
        serviceTypes.getAll()
      ]);

      // Set totals
      setTotalVotes(allVotes.length);
      setTotalCompanies(allCompanies.length);
      setTotalServiceTypes(allServiceTypes.length);
      setAllVotes(allVotes);

      // Process company votes
      const companyVotesMap = new Map<string, number>();

      allVotes.forEach((vote: Vote) => {
        const companyId = vote.id_empresa;
        companyVotesMap.set(companyId, (companyVotesMap.get(companyId) || 0) + 1);
      });

      const processedCompanyVotes = allCompanies.map((company: Company) => ({
        name: company.nome,
        votes: companyVotesMap.get(company.id) || 0,
        id: company.id
      }));

      // Process service type votes
      const serviceVotesMap = new Map<string, number>();

      allVotes.forEach((vote: Vote) => {
        const serviceId = vote.id_tipo_servico;
        serviceVotesMap.set(serviceId, (serviceVotesMap.get(serviceId) || 0) + 1);
      });

      const processedServiceVotes = allServiceTypes.map((service: ServiceType) => ({
        name: service.nome,
        votes: serviceVotesMap.get(service.id) || 0,
        id: service.id
      }));

      // Calculate time-based metrics
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const votesToday = allVotes.filter((vote: Vote) => new Date(vote.momento_voto) >= today).length;
      const votesThisWeek = allVotes.filter((vote: Vote) => new Date(vote.momento_voto) >= weekAgo).length;
      const votesThisMonth = allVotes.filter((vote: Vote) => new Date(vote.momento_voto) >= monthAgo).length;

      setVotesData({
        today: votesToday,
        week: votesThisWeek,
        month: votesThisMonth
      });

      setCompanyVotes(processedCompanyVotes);
      setServiceTypeVotes(processedServiceVotes);

      // Show notifications for recent votes
      if (!loading && allVotes.length > 0) {
        const latestVote = allVotes[0];
        const voteTime = new Date(latestVote.momento_voto);
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        if (voteTime > fiveMinutesAgo) {
          const company = allCompanies.find((c: Company) => c.id === latestVote.id_empresa);
          const service = allServiceTypes.find((s: ServiceType) => s.id === latestVote.id_tipo_servico);

          if (company && service) {
            toast.info(
              `Novo voto para ${company.nome} - ${service.nome}`,
              {
                icon: <Zap className="h-4 w-4" />,
                duration: 4000
              }
            );
          }
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-20 pb-10">
        <div className="flex flex-col space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Monitore votos e métricas das empresas em tempo real
              </p>
            </div>

            <div className="flex gap-3">
              <Link to="/monitor">
                <Button variant="outline" className="gap-2">
                  <MonitorIcon size={16} />
                  Modo Monitor
                </Button>
              </Link>
            </div>
          </div>

          <NewsTicker votes={allVotes.slice(0, 10)} />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card relative overflow-hidden">
              <div className="absolute right-4 top-4 opacity-20">
                <Zap className="h-12 w-12 text-primary" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription>Votos Totais</CardDescription>
                <div className="flex items-end justify-between">
                  {loading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <CardTitle className="text-3xl font-bold">{totalVotes}</CardTitle>
                  )}
                  <div className="text-xs text-primary flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Tempo Real
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="glass-card relative overflow-hidden">
              <div className="absolute right-4 top-4 opacity-20">
                <Activity className="h-12 w-12 text-indigo-500" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription>Atividade Recente</CardDescription>
                <div className="flex flex-col gap-1">
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Hoje</span>
                        <span className="text-sm font-medium">{votesData.today}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Esta semana</span>
                        <span className="text-sm font-medium">{votesData.week}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Este mês</span>
                        <span className="text-sm font-medium">{votesData.month}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Card className="glass-card relative overflow-hidden">
              <div className="absolute right-4 top-4 opacity-20">
                <Building className="h-12 w-12 text-blue-500" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription>Empresas</CardDescription>
                <div className="flex items-end justify-between">
                  {loading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <CardTitle className="text-3xl font-bold">{totalCompanies}</CardTitle>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Card className="glass-card relative overflow-hidden">
              <div className="absolute right-4 top-4 opacity-20">
                <BarChart className="h-12 w-12 text-green-500" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription>Tipos de Serviço</CardDescription>
                <div className="flex items-end justify-between">
                  {loading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <CardTitle className="text-3xl font-bold">{totalServiceTypes}</CardTitle>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Gráficos Adicionais */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Análise Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <VoteCharts votes={allVotes} />
            </CardContent>
          </Card>

          {/* Charts and Recent Votes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Distribuição de Votos</CardTitle>
                </CardHeader>
                <CardContent>
                  <VoteChart
                    data={companyVotes}
                    title="Votos por Empresa"
                    description="Todas as empresas com votos registrados"
                  />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <RecentVotes />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
