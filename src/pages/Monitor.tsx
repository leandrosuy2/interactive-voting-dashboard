
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { companies, serviceTypes, votes } from '@/services/api';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { VoteAnalytics } from '@/types/vote';
import { ArrowUpRight, BarChart2, LineChart, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#26A69A', '#EF5350', '#AB47BC'];

const Monitor: React.FC = () => {
  const [analytics, setAnalytics] = useState<VoteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const [allVotes, allCompanies, allServiceTypes] = await Promise.all([
        votes.getAll(),
        companies.getAll(),
        serviceTypes.getAll()
      ]);
      
      // Process raw data into analytics format
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      // Count votes for different time periods
      const votesToday = allVotes.filter((vote: any) => 
        new Date(vote.created_at) >= today
      ).length;
      
      const votesThisWeek = allVotes.filter((vote: any) => 
        new Date(vote.created_at) >= weekAgo
      ).length;
      
      // Process company votes
      const companyVotes = new Map<string, number>();
      allVotes.forEach((vote: any) => {
        const companyId = vote.id_empresa;
        companyVotes.set(companyId, (companyVotes.get(companyId) || 0) + 1);
      });
      
      const topCompanies = allCompanies
        .map((company: any) => ({
          name: company.name,
          votes: companyVotes.get(company.id) || 0
        }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5);
      
      // Process service type votes
      const serviceVotes = new Map<string, number>();
      allVotes.forEach((vote: any) => {
        const serviceId = vote.id_tipo_servico;
        serviceVotes.set(serviceId, (serviceVotes.get(serviceId) || 0) + 1);
      });
      
      const topServices = allServiceTypes
        .map((service: any) => ({
          name: service.name,
          votes: serviceVotes.get(service.id) || 0
        }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5);
      
      // Process votes by hour
      const hourCounts = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
      allVotes.forEach((vote: any) => {
        const hour = new Date(vote.created_at).getHours();
        hourCounts[hour].count += 1;
      });
      
      // Process votes by day
      const last7Days = Array(7).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
          date: new Date(date.setHours(0, 0, 0, 0)),
          count: 0
        };
      }).reverse();
      
      allVotes.forEach((vote: any) => {
        const voteDate = new Date(vote.created_at);
        voteDate.setHours(0, 0, 0, 0);
        
        const dayIndex = last7Days.findIndex(d => d.date.getTime() === voteDate.getTime());
        if (dayIndex !== -1) {
          last7Days[dayIndex].count += 1;
        }
      });
      
      const votesByDay = last7Days.map(d => ({ day: d.day, count: d.count }));
      
      // Calculate average
      const averageVotesPerDay = allVotes.length > 0 
        ? Math.round((votesThisWeek / 7) * 10) / 10 
        : 0;
      
      setAnalytics({
        totalVotes: allVotes.length,
        votesToday,
        votesThisWeek,
        averageVotesPerDay,
        topCompanies,
        topServices,
        votesByHour: hourCounts,
        votesByDay
      });
      
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch initial data
  useEffect(() => {
    fetchAnalyticsData();
    
    // Set up auto-refresh (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchAnalyticsData();
      setCurrentTime(new Date());
    }, 30000);
    
    // Clock update every second
    const clockId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(clockId);
    };
  }, []);
  
  if (loading && !analytics) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Header with time and date */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <BarChart2 size={24} className="text-primary mr-2" />
          <h1 className="text-2xl font-bold">Monitor de Votações</h1>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold">
            {currentTime.toLocaleTimeString('pt-BR')}
          </div>
          <div className="text-muted-foreground">
            {currentTime.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-4 grid grid-cols-12 gap-4 h-[calc(100vh-80px)]">
        {/* Left column - Stats */}
        <div className="col-span-3 flex flex-col gap-4">
          <Card className="bg-black border-gray-800 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Votos Totais</CardDescription>
              <div className="flex items-end justify-between">
                <CardTitle className="text-4xl font-bold text-white">
                  {analytics?.totalVotes ?? 0}
                </CardTitle>
                <div className="text-xs text-primary flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Tempo Real
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="bg-black border-gray-800 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Votos Hoje</CardDescription>
              <div className="flex items-end justify-between">
                <CardTitle className="text-4xl font-bold text-white">
                  {analytics?.votesToday ?? 0}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="bg-black border-gray-800 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Média Diária</CardDescription>
              <div className="flex items-end justify-between">
                <CardTitle className="text-4xl font-bold text-white">
                  {analytics?.averageVotesPerDay ?? 0}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="bg-black border-gray-800 text-white flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-white">Top Serviços</CardTitle>
                <CardDescription className="text-gray-400">
                  Serviços mais votados
                </CardDescription>
              </div>
              <PieChartIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.topServices}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="votes"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics?.topServices.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Center column - Main chart */}
        <div className="col-span-6 flex flex-col gap-4">
          <Card className="bg-black border-gray-800 text-white flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-white">Tendência de Votos</CardTitle>
                <CardDescription className="text-gray-400">
                  Atividade dos últimos 7 dias
                </CardDescription>
              </div>
              <LineChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics?.votesByDay}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      stroke="#6b7280" 
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        borderColor: '#374151',
                        color: 'white'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count"
                      name="Votos"
                      stroke="#0088FE" 
                      fillOpacity={1} 
                      fill="url(#colorVotes)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-gray-800 text-white flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-white">Distribuição por Hora</CardTitle>
                <CardDescription className="text-gray-400">
                  Horários com maior atividade
                </CardDescription>
              </div>
              <BarChart2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.votesByHour}>
                    <XAxis 
                      dataKey="hour" 
                      stroke="#6b7280" 
                      tick={{ fill: '#6b7280' }}
                      tickFormatter={(hour) => `${hour}h`}
                    />
                    <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        borderColor: '#374151',
                        color: 'white'
                      }}
                      formatter={(value) => [`${value} votos`, 'Quantidade']}
                      labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Votos" 
                      fill="#00C49F" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Company ranking */}
        <div className="col-span-3 flex flex-col gap-4">
          <Card className="bg-black border-gray-800 text-white flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-white">Top Empresas</CardTitle>
                <CardDescription className="text-gray-400">
                  Empresas mais votadas
                </CardDescription>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics?.topCompanies.map((company, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium flex items-center">
                        <span className="w-6 text-muted-foreground">{index + 1}.</span>
                        <span className="truncate">{company.name}</span>
                      </div>
                      <div className="font-mono text-right text-white">{company.votes}</div>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (company.votes / (analytics.topCompanies[0]?.votes || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-gray-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Status do Sistema</CardTitle>
              <CardDescription className="text-gray-400">
                Monitoramento em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>API</span>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <span className="text-green-500">Online</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Base de Dados</span>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <span className="text-green-500">Online</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Atualizações</span>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <span className="text-green-500">Tempo Real</span>
                  </div>
                </div>
                <div className="pt-2 text-xs text-gray-500 flex justify-between">
                  <span>Última atualização:</span>
                  <span>{currentTime.toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Monitor;
