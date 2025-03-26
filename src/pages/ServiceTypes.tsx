import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceTypes, companies } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Clock, Search, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServiceType, CreateServiceTypeRequest, UpdateServiceTypeRequest } from '@/types/serviceType';
import { Company } from '@/types/company';
import Navbar from '@/components/Navbar';

const ServiceTypes: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddServiceTypeOpen, setIsAddServiceTypeOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateServiceTypeRequest>({
    id_empresa: '',
    tipo_servico: '',
    nome: '',
    hora_inicio: '',
    hora_final: '',
    user_add: 'admin',
  });

  const { data: serviceTypesData, isLoading: isLoadingServiceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: serviceTypes.getAll,
  });

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const createMutation = useMutation({
    mutationFn: serviceTypes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      setIsAddServiceTypeOpen(false);
      toast({
        title: "Tipo de serviço adicionado",
        description: "Tipo de serviço adicionado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceTypeRequest }) =>
      serviceTypes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      setIsAddServiceTypeOpen(false);
      toast({
        title: "Tipo de serviço atualizado",
        description: "Tipo de serviço atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: serviceTypes.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: "Tipo de serviço excluído",
        description: "Tipo de serviço excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setFormData({
      id_empresa: serviceType.id_empresa,
      tipo_servico: serviceType.tipo_servico,
      nome: serviceType.nome,
      hora_inicio: serviceType.hora_inicio,
      hora_final: serviceType.hora_final,
      user_add: serviceType.user_add,
    });
    setIsAddServiceTypeOpen(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceType) {
      updateMutation.mutate({
        id: selectedServiceType.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredServiceTypes = serviceTypesData?.filter((serviceType: ServiceType) =>
    serviceType.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    serviceType.tipo_servico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Tipos de Serviço</h1>
            <p className="text-muted-foreground max-w-2xl">
              Gerencie os tipos de serviço disponíveis para as empresas.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['service-types'] })}
              className="h-9 w-9"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setSelectedServiceType(null);
                setFormData({
                  id_empresa: '',
                  tipo_servico: '',
                  nome: '',
                  hora_inicio: '',
                  hora_final: '',
                  user_add: 'admin',
                });
                setIsAddServiceTypeOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Tipo de Serviço
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipos de serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoadingServiceTypes ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : filteredServiceTypes && filteredServiceTypes.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo de Serviço</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServiceTypes.map((serviceType: ServiceType) => (
                  <TableRow key={serviceType.id}>
                    <TableCell className="font-medium">{serviceType.nome}</TableCell>
                    <TableCell>{serviceType.tipo_servico}</TableCell>
                    <TableCell>
                      {companiesData?.find((company: Company) => company.id === serviceType.id_empresa)?.nome || serviceType.id_empresa}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{serviceType.hora_inicio} - {serviceType.hora_final}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(serviceType)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Tipo de Serviço</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o tipo de serviço "{serviceType.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(serviceType.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-lg border-border bg-secondary/20">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum tipo de serviço encontrado' : 'Nenhum tipo de serviço cadastrado'}
            </p>
          </div>
        )}

        <Dialog open={isAddServiceTypeOpen} onOpenChange={setIsAddServiceTypeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedServiceType ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
              </DialogTitle>
              <DialogDescription>
                {selectedServiceType
                  ? 'Edite as informações do tipo de serviço.'
                  : 'Adicione um novo tipo de serviço.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id_empresa">Empresa</Label>
                <Select
                  value={formData.id_empresa}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_empresa: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCompanies ? (
                      <div className="p-2 text-sm text-muted-foreground">Carregando empresas...</div>
                    ) : companiesData && companiesData.length > 0 ? (
                      companiesData.map((company: Company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.nome}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">Nenhuma empresa cadastrada</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_servico">Tipo de Serviço</Label>
                <Input
                  id="tipo_servico"
                  value={formData.tipo_servico}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo_servico: e.target.value })
                  }
                  placeholder="Digite o tipo de serviço"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Digite o nome"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora Início</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) =>
                      setFormData({ ...formData, hora_inicio: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_final">Hora Final</Label>
                  <Input
                    id="hora_final"
                    type="time"
                    value={formData.hora_final}
                    onChange={(e) =>
                      setFormData({ ...formData, hora_final: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddServiceTypeOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? (selectedServiceType ? 'Salvando...' : 'Adicionando...')
                    : (selectedServiceType ? 'Salvar' : 'Adicionar')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceTypes;
