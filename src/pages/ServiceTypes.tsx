
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceTypes } from '@/services/api';
import { ServiceType } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, LayoutList } from 'lucide-react';
import ServiceTypeCard from '@/components/ServiceTypeCard';
import AddServiceTypeDialog from '@/components/AddServiceTypeDialog';

const ServiceTypes: React.FC = () => {
  const { toast } = useToast();
  const [isAddServiceTypeOpen, setIsAddServiceTypeOpen] = useState(false);

  const { 
    data: serviceTypesData, 
    isLoading: serviceTypesLoading, 
    error: serviceTypesError,
    refetch: refetchServiceTypes
  } = useQuery({
    queryKey: ['serviceTypes'],
    queryFn: serviceTypes.getAll,
  });

  const handleRefresh = () => {
    refetchServiceTypes();
    toast({
      title: "Atualizado",
      description: "Lista de tipos de serviço atualizada com sucesso",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Tipos de Serviço</h1>
            <p className="text-muted-foreground max-w-2xl">
              Gerencie os tipos de serviço que as empresas podem oferecer para votação.
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
              onClick={() => setIsAddServiceTypeOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Tipo</span>
            </Button>
          </div>
        </div>

        {serviceTypesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div 
                key={index} 
                className="h-[160px] rounded-lg bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : serviceTypesError ? (
          <div className="text-center py-12">
            <p className="text-destructive text-lg">Erro ao carregar tipos de serviço</p>
            <Button 
              variant="outline" 
              onClick={() => refetchServiceTypes()} 
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {serviceTypesData?.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg border-border bg-secondary/20 flex flex-col items-center justify-center">
                <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum tipo de serviço cadastrado</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Adicione tipos de serviço para que as empresas possam ser avaliadas.
                </p>
                <Button onClick={() => setIsAddServiceTypeOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Tipo de Serviço
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {serviceTypesData?.map((serviceType: ServiceType) => (
                  <ServiceTypeCard
                    key={serviceType.id}
                    id={serviceType.id}
                    name={serviceType.name}
                    description={serviceType.description}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AddServiceTypeDialog 
        open={isAddServiceTypeOpen} 
        onOpenChange={setIsAddServiceTypeOpen}
        onSuccess={() => {
          refetchServiceTypes();
          toast({
            title: "Tipo de serviço adicionado",
            description: "Tipo de serviço adicionado com sucesso",
          });
        }}
      />
    </div>
  );
};

export default ServiceTypes;
