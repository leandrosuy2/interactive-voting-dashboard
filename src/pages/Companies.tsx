
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { companies, serviceTypes } from '@/services/api';
import { Company, ServiceType } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import CompanyCard from '@/components/CompanyCard';
import { Button } from '@/components/ui/button';
import { Plus, Building, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddCompanyDialog from '@/components/AddCompanyDialog';
import { useState } from 'react';

const Companies: React.FC = () => {
  const { toast } = useToast();
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);

  const { 
    data: companiesData, 
    isLoading: companiesLoading, 
    error: companiesError,
    refetch: refetchCompanies
  } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const handleRefresh = () => {
    refetchCompanies();
    toast({
      title: "Atualizado",
      description: "Lista de empresas atualizada com sucesso",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Empresas</h1>
            <p className="text-muted-foreground max-w-2xl">
              Gerencie as empresas que participam do sistema de votação de satisfação.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </Button>
            <Button 
              onClick={() => setIsAddCompanyOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Empresa</span>
            </Button>
          </div>
        </div>

        {companiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div 
                key={index} 
                className="h-[200px] rounded-lg bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : companiesError ? (
          <div className="text-center py-12">
            <p className="text-destructive text-lg">Erro ao carregar empresas</p>
            <Button 
              variant="outline" 
              onClick={() => refetchCompanies()} 
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {companiesData?.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg border-border bg-secondary/20 flex flex-col items-center justify-center">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma empresa cadastrada</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Adicione empresas para começar a coletar votos de satisfação dos seus clientes.
                </p>
                <Button onClick={() => setIsAddCompanyOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {companiesData?.map((company: Company) => (
                  <CompanyCard
                    key={company.id}
                    id={company.id}
                    name={company.name}
                    description={company.description}
                    totalVotes={company.analytics?.totalVotes || 0}
                    serviceCount={5} // This would normally come from the API
                    isTopVoted={company.analytics?.totalVotes > 50}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AddCompanyDialog 
        open={isAddCompanyOpen} 
        onOpenChange={setIsAddCompanyOpen}
        onSuccess={() => {
          refetchCompanies();
          toast({
            title: "Empresa adicionada",
            description: "Empresa adicionada com sucesso",
          });
        }}
      />
    </div>
  );
};

export default Companies;
