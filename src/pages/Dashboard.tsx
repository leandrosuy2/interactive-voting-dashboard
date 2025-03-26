
import React, { useState, useEffect } from 'react';
import { companies, serviceTypes, votes } from '@/services/api';
import VoteChart from '@/components/VoteChart';
import RealTimeVotes from '@/components/RealTimeVotes';
import ServiceTypeFilter from '@/components/ServiceTypeFilter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, BarChart, Building, Users, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';

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
  const [filteredServiceIds, setFilteredServiceIds] = useState<string[]>([]);
  
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
      
      // Process company votes
      const companyVotesMap = new Map<string, number>();
      
      allVotes.forEach((vote: any) => {
        // Apply service type filter if active
        if (filteredServiceIds.length > 0 && !filteredServiceIds.includes(vote.id_tipo_servico)) {
          return;
        }
        
        const companyId = vote.id_empresa;
        companyVotesMap.set(companyId, (companyVotesMap.get(companyId) || 0) + 1);
      });
      
      const processedCompanyVotes = allCompanies.map((company: any) => ({
        name: company.name,
        votes: companyVotesMap.get(company.id) || 0,
        id: company.id
      }));
      
      // Process service type votes
      const serviceVotesMap = new Map<string, number>();
      
      allVotes.forEach((vote: any) => {
        const serviceId = vote.id_tipo_servico;
        serviceVotesMap.set(serviceId, (serviceVotesMap.get(serviceId) || 0) + 1);
      });
      
      const processedServiceVotes = allServiceTypes.map((service: any) => ({
        name: service.name,
        votes: serviceVotesMap.get(service.id) || 0,
        id: service.id
      }));
      
      setCompanyVotes(processedCompanyVotes);
      setServiceTypeVotes(processedServiceVotes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
  }, [filteredServiceIds]);
  
  // Handle filter changes
  const handleFilterChange = (selectedIds: string[]) => {
    setFilteredServiceIds(selectedIds);
  };
  
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
            
            <ServiceTypeFilter onFilterChange={handleFilterChange} />
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Building className="h-12 w-12 text-primary" />
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
                <BarChart className="h-12 w-12 text-primary" />
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
          
          {/* Charts & Real-time Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Tabs defaultValue="companies" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Análise de Votos</h2>
                <TabsList>
                  <TabsTrigger value="companies" className="text-xs">Empresas</TabsTrigger>
                  <TabsTrigger value="services" className="text-xs">Serviços</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="companies">
                {loading && companyVotes.length === 0 ? (
                  <Card className="glass-card">
                    <CardHeader>
                      <Skeleton className="h-8 w-64 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <VoteChart 
                    data={companyVotes}
                    title="Votos por Empresa"
                    description={
                      filteredServiceIds.length > 0 
                        ? "Filtrado por tipos de serviços selecionados" 
                        : "Todas as empresas com votos registrados"
                    }
                  />
                )}
              </TabsContent>
              
              <TabsContent value="services">
                {loading && serviceTypeVotes.length === 0 ? (
                  <Card className="glass-card">
                    <CardHeader>
                      <Skeleton className="h-8 w-64 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <VoteChart 
                    data={serviceTypeVotes}
                    title="Votos por Tipo de Serviço"
                    description="Distribuição de votos por categoria de serviço"
                  />
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Votos Recentes</h2>
              <RealTimeVotes />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
