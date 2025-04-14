import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportPDFProps {
  contentRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
  title?: string;
  subtitle?: string;
}

export function ExportPDF({ 
  contentRef, 
  fileName = 'relatorio.pdf',
  title = 'Relatório de Satisfação',
  subtitle = 'Análise de Avaliações'
}: ExportPDFProps) {
  const handleExport = async () => {
    if (!contentRef.current) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // Largura A4
      const pageHeight = 297; // Altura A4
      const margin = 10;

      // Adiciona o cabeçalho
      pdf.setFontSize(24);
      pdf.text(title, pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(subtitle, pageWidth / 2, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 40, { align: 'center' });

      // Captura o conteúdo em partes
      const contentHeight = contentRef.current.scrollHeight;
      const viewportHeight = window.innerHeight;
      const numPages = Math.ceil(contentHeight / viewportHeight);

      for (let i = 0; i < numPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Ajusta a posição do scroll para capturar cada parte
        contentRef.current.scrollTop = i * viewportHeight;

        // Aguarda um momento para o scroll ser aplicado
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(contentRef.current, {
          scale: 1,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: contentRef.current.scrollWidth,
          windowHeight: viewportHeight,
          scrollY: -i * viewportHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Adiciona a imagem ao PDF
        pdf.addImage(imgData, 'PNG', margin, margin + 50, imgWidth, imgHeight);

        // Adiciona o número da página
        pdf.setFontSize(10);
        pdf.text(`Página ${i + 1} de ${numPages}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar PDF
    </Button>
  );
} 