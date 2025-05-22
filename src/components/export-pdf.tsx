import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function ExportPDF({ contentRef, fileName = 'relatorio.pdf', title = 'Relatório de Satisfação', subtitle = 'Análise de Avaliações' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current) return;

    setLoading(true); // 👉 Ativa o loading

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;

      pdf.setFontSize(24);
      pdf.text(title, pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(subtitle, pageWidth / 2, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 40, { align: 'center' });

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
      });

      const imgProps = { width: canvas.width, height: canvas.height };
      const pdfImgWidth = pageWidth - margin * 2;

      // Pega pontos de quebra
      const breakDivs = contentRef.current.querySelectorAll('.page-break');
      const breakPoints: number[] = [];

      breakDivs.forEach(div => {
        const rect = (div as HTMLElement).getBoundingClientRect();
        const offsetTop = rect.top + window.scrollY - contentRef.current.offsetTop;
        breakPoints.push(Math.round(offsetTop * 2));
      });

      const allBreaks = [0, ...breakPoints, canvas.height];

      // for (let i = 0; i < allBreaks.length - 1; i++) {
      for (let i = 0; i < allBreaks.length - 1 && i < 3; i++) {
        if (i > 0) pdf.addPage();

        const sliceStart = allBreaks[i];
        const sliceEnd = allBreaks[i + 1];
        const sliceHeight = sliceEnd - sliceStart;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (!ctx) throw new Error('Contexto inválido');

        ctx.drawImage(canvas, 0, sliceStart, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const imgData = pageCanvas.toDataURL('image/png');
        const imgHeight = (sliceHeight * pdfImgWidth) / canvas.width;
        const yPos = i === 0 ? margin + 50 : margin;

        pdf.addImage(imgData, 'PNG', margin, yPos, pdfImgWidth, imgHeight);
        pdf.setFontSize(10);
        // pdf.text(`Página ${i + 1} de ${allBreaks.length - 1}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
        const totalPages = Math.min(allBreaks.length - 1, 3);
        // ...
        pdf.text(`Página ${i + 1} de ${totalPages}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }

    setLoading(false); // 👉 Finaliza o loading
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-2"
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        {loading ? 'Gerando PDF...' : 'Exportar PDF'}
      </Button>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span>Gerando PDF, aguarde...</span>
          </div>
        </div>
      )}
    </>
  );
}