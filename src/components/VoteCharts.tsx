import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Vote } from '@/types/vote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface VoteChartsProps {
  votes: Vote[];
}

const VoteCharts: React.FC<VoteChartsProps> = ({ votes }) => {
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
        return 'rgb(34, 197, 94)'; // green-500
      case 'Bom':
        return 'rgb(59, 130, 246)'; // blue-500
      case 'Regular':
        return 'rgb(234, 179, 8)'; // yellow-500
      case 'Ruim':
        return 'rgb(239, 68, 68)'; // red-500
      default:
        return 'rgb(156, 163, 175)'; // gray-400
    }
  };

  // Dados para o gráfico de pizza (distribuição de avaliações)
  const pieData = {
    labels: ['Ótimo', 'Bom', 'Regular', 'Ruim'],
    datasets: [
      {
        data: [
          votes.filter(v => v.avaliacao === 'Ótimo').length,
          votes.filter(v => v.avaliacao === 'Bom').length,
          votes.filter(v => v.avaliacao === 'Regular').length,
          votes.filter(v => v.avaliacao === 'Ruim').length,
        ],
        backgroundColor: [
          getRatingColor('Ótimo'),
          getRatingColor('Bom'),
          getRatingColor('Regular'),
          getRatingColor('Ruim'),
        ],
        borderWidth: 0,
      },
    ],
  };

  // Dados para o gráfico de linha (tendência de avaliações)
  const sortedVotes = [...votes].sort((a, b) => 
    new Date(a.momento_voto).getTime() - new Date(b.momento_voto).getTime()
  );

  const lineData = {
    labels: sortedVotes.map(vote => 
      format(new Date(vote.momento_voto), "dd/MM", { locale: ptBR })
    ),
    datasets: [
      {
        label: 'Avaliação',
        data: sortedVotes.map(vote => getRatingValue(vote.avaliacao)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Dados para o gráfico de barras (votos por serviço)
  const serviceVotes = votes.reduce((acc, vote) => {
    acc[vote.serviceType.nome] = (acc[vote.serviceType.nome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = {
    labels: Object.keys(serviceVotes),
    datasets: [
      {
        label: 'Votos',
        data: Object.values(serviceVotes),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Gráfico de Pizza */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Linha */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">Tendência de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line data={lineData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">Votos por Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Bar data={barData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteCharts; 