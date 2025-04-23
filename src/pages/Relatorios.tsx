import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { votes, companies } from '@/services/api';
import { VoteAnalytics } from '@/types/vote';
import Navbar from '@/components/Navbar';
import { ExportPDF } from '@/components/export-pdf';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = {
  'Ótimo': '#22c55e',
  'Bom': '#3b82f6',
  'Regular': '#f59e0b',
  'Ruim': '#ef4444'
};

export default function Relatorios() {
  const { id } = useParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [quickFilter, setQuickFilter] = useState('1d');
  const [selectedCompany, setSelectedCompany] = useState<string>(id || '');
  const [isExporting, setIsExporting] = useState(false);

  const { data: companiesList } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const { data: analytics } = useQuery({
    queryKey: ['votes', 'analytics', selectedCompany, dateRange, quickFilter],
    queryFn: () => {
      let startDate = new Date();
      let endDate = new Date();

      if (dateRange?.from && dateRange?.to) {
        startDate = dateRange.from;
        endDate = dateRange.to;
      } else {
        // Aplicar filtro rápido
        switch (quickFilter) {
          case '1d':
            startDate = new Date();
            endDate = new Date();
            break;
          case '7d':
            startDate = addDays(new Date(), -7);
            endDate = new Date();
            break;
          case '30d':
            startDate = addDays(new Date(), -30);
            endDate = new Date();
            break;
        }
      }

      return votes.getAnalytics(selectedCompany, {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
    },
    enabled: !!selectedCompany,
  });

  const pontosMelhoriaData = analytics ? Object.entries(analytics.avaliacoesPorTipo).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS]
  })) : [];

  const resultadoDiaData = analytics ? Object.entries(analytics.percentuaisPorTipo).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS]
  })) : [];

  const satisfacaoServicoData = analytics ? Object.entries(analytics.votesByService)
    .map(([id, data]) => ({
      name: data.serviceInfo?.nome || id,
      total: data.total,
      avaliacoes: data.avaliacoes,
      percentuais: data.percentuais
    })) : [];

  const satisfactionPercent = analytics 
    ? ((analytics.avaliacoesPorTipo.Ótimo + analytics.avaliacoesPorTipo.Bom) / analytics.totalVotes * 100)
    : 0;

  const getFileName = () => {
    const startDate = dateRange?.from ? format(dateRange.from, 'dd-MM-yyyy') : '';
    const endDate = dateRange?.to ? format(dateRange.to, 'dd-MM-yyyy') : '';
    return `relatorio-${startDate}-${endDate}.pdf`;
  };

  const getServiceEmoji = (name: string) => {
    switch (name.toLowerCase()) {
      case 'desjejum':
        return '🥐';
      case 'almoço':
        return '🍽️';
      case 'janta':
        return '🍲';
      case 'ceia':
        return '🌙';
      case 'merenda':
        return '🍎';
      default:
        return '📊';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Ótimo':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Bom':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Regular':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Ruim':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRatingEmoji = (rating: string) => {
    switch (rating) {
      case 'Ótimo':
        return '😊';
      case 'Bom':
        return '🙂';
      case 'Regular':
        return '😐';
      case 'Ruim':
        return '😞';
      default:
        return '❓';
    }
  };

  const getSatisfactionLevel = (percentual: number) => {
    if (percentual >= 80) return 'Excelente';
    if (percentual >= 60) return 'Bom';
    if (percentual >= 40) return 'Regular';
    return 'Precisa melhorar';
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setQuickFilter('custom');
  };

  const handleQuickFilterChange = (value: string) => {
    setQuickFilter(value);
    if (value !== 'custom') {
      setDateRange(undefined);
    }
  };

  const getPeriodText = () => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
    }

    switch (quickFilter) {
      case '1d':
        return 'Hoje';
      case '7d':
        return 'Últimos 7 dias';
      case '30d':
        return 'Últimos 30 dias';
      default:
        return 'Hoje';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    // Força uma nova renderização dos gráficos
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
              <p className="text-muted-foreground">
                {selectedCompany 
                  ? `Relatórios de ${companiesList?.find(c => c.id === selectedCompany)?.nome}`
                  : 'Relatórios Gerais'}
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
              <Select
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger className="w-[200px]">
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
              <Tabs value={quickFilter} onValueChange={handleQuickFilterChange}>
                <TabsList>
                  <TabsTrigger value="1d">Hoje</TabsTrigger>
                  <TabsTrigger value="7d">7 dias</TabsTrigger>
                  <TabsTrigger value="30d">30 dias</TabsTrigger>
                  <TabsTrigger value="custom">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
              <DateRangePicker 
                date={dateRange} 
                onDateChange={handleDateChange}
              />
              <ExportPDF 
                contentRef={contentRef} 
                fileName={getFileName()}
                title={`Relatório de Satisfação - ${companiesList?.find(c => c.id === selectedCompany)?.nome || 'Geral'}`}
                subtitle={`Período: ${getPeriodText()}`}
              />
            </div>
          </div>

          {!selectedCompany ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Selecione uma empresa</h2>
                <p className="text-muted-foreground">Escolha uma empresa para visualizar os relatórios</p>
              </div>
            </div>
          ) : !analytics ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Carregando dados...</h2>
                <p className="text-muted-foreground">Aguarde enquanto buscamos as informações</p>
              </div>
            </div>
          ) : (
            <div 
              id="content-to-export" 
              ref={contentRef} 
              className="space-y-6 bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{`Relatório de Satisfação - ${companiesList?.find(c => c.id === selectedCompany)?.nome || 'Geral'}`}</h2>
                <p className="text-muted-foreground">{`Período: ${getPeriodText()}`}</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {/* Resumo Geral */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">📊</span>
                          Total de Votos
                        </CardTitle>
                        <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {analytics.totalVotes} votos
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Votos no período</span>
                          <span className="text-4xl font-bold">{analytics.totalVotes}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-500">Média diária</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {(analytics.totalVotes / 7).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">📈</span>
                          Taxa de Satisfação
                        </CardTitle>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          satisfactionPercent >= 80 ? 'bg-green-100 text-green-800' :
                          satisfactionPercent >= 60 ? 'bg-blue-100 text-blue-800' :
                          satisfactionPercent >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getSatisfactionLevel(satisfactionPercent)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Satisfação geral</span>
                          <span className="text-4xl font-bold text-green-600">
                            {satisfactionPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-500">Votos positivos</span>
                          <span className="text-2xl font-bold">
                            {analytics.avaliacoesPorTipo.Ótimo + analytics.avaliacoesPorTipo.Bom}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos Principais */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">📊</span>
                          Distribuição de Avaliações
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Total:</span>
                          <span className="font-bold">{analytics.totalVotes}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={pontosMelhoriaData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                padding: '0.5rem'
                              }}
                              formatter={(value: number) => [`${value} votos`, '']}
                            />
                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                              {pontosMelhoriaData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {pontosMelhoriaData.map((entry) => (
                          <div 
                            key={entry.name}
                            className={`flex items-center justify-between p-3 rounded-lg border ${getRatingColor(entry.name)}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getRatingEmoji(entry.name)}</span>
                              <span className="font-medium">{entry.name}</span>
                            </div>
                            <span className="font-bold">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">📊</span>
                          Resultado do Dia
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Data:</span>
                          <span className="font-bold">{format(new Date(), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={resultadoDiaData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {resultadoDiaData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                padding: '0.5rem'
                              }}
                              formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              formatter={(value) => (
                                <span className="text-sm">{value}</span>
                              )}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {resultadoDiaData.map((entry) => (
                          <div 
                            key={entry.name}
                            className={`flex items-center justify-between p-3 rounded-lg border ${getRatingColor(entry.name)}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getRatingEmoji(entry.name)}</span>
                              <span className="font-medium">{entry.name}</span>
                            </div>
                            <span className="font-bold">{entry.value.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Análise por Serviço */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🍽️</span>
                      Análise por Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(analytics.votesByService)
                        .filter(([_, data]) => data.serviceInfo)
                        .map(([_, data]) => {
                          const satisfactionPercent = data.percentuais.Ótimo + data.percentuais.Bom;
                          return (
                            <div key={data.serviceInfo?.nome} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="text-2xl">{getServiceEmoji(data.serviceInfo?.nome || '')}</span>
                                    {data.serviceInfo?.nome}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {data.serviceInfo?.hora_inicio} - {data.serviceInfo?.hora_final}
                                  </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  satisfactionPercent >= 80 ? 'bg-green-100 text-green-800' :
                                  satisfactionPercent >= 60 ? 'bg-blue-100 text-blue-800' :
                                  satisfactionPercent >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {satisfactionPercent.toFixed(1)}%
                                </div>
                              </div>
                              <div className="space-y-2">
                                {Object.entries(data.avaliacoes).map(([rating, count]) => (
                                  <div 
                                    key={rating}
                                    className={`flex items-center justify-between p-2 rounded-lg ${getRatingColor(rating)}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{getRatingEmoji(rating)}</span>
                                      <span className="font-medium">{rating}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold">{count}</span>
                                      <span className="text-sm text-muted-foreground">
                                        ({data.percentuais[rating as keyof typeof data.percentuais].toFixed(1)}%)
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                {/* Pontos de Atenção */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      Pontos de Atenção
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analytics.votesByService)
                        .filter(([_, data]) => {
                          const satisfactionPercent = data.percentuais.Ótimo + data.percentuais.Bom;
                          return satisfactionPercent < 80 || data.avaliacoes.Ruim > 0 || data.avaliacoes.Regular > 0;
                        })
                        .map(([_, data]) => {
                          const satisfactionPercent = data.percentuais.Ótimo + data.percentuais.Bom;
                          return (
                            <div key={data.serviceInfo?.nome || 'Sem serviço'} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <span className="text-2xl">{getServiceEmoji(data.serviceInfo?.nome || '')}</span>
                                  {data.serviceInfo?.nome || 'Sem serviço'}
                                </h3>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  satisfactionPercent >= 80 ? 'bg-green-100 text-green-800' :
                                  satisfactionPercent >= 60 ? 'bg-blue-100 text-blue-800' :
                                  satisfactionPercent >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {satisfactionPercent.toFixed(1)}% de satisfação
                                </div>
                              </div>
                              {data.serviceInfo && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Horário: {data.serviceInfo.hora_inicio} - {data.serviceInfo.hora_final}
                                </p>
                              )}
                              <div className="space-y-2">
                                {data.avaliacoes.Ruim > 0 && (
                                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
                                    <span>⚠️</span>
                                    <span>{data.avaliacoes.Ruim} avaliações ruins</span>
                                  </div>
                                )}
                                {data.avaliacoes.Regular > 0 && (
                                  <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                                    <span>⚠️</span>
                                    <span>{data.avaliacoes.Regular} avaliações regulares</span>
                                  </div>
                                )}
                                {satisfactionPercent < 80 && (
                                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-2 rounded-lg">
                                    <span>📊</span>
                                    <span>Satisfação abaixo da meta (80%)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}