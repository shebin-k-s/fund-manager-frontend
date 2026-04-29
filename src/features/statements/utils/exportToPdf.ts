import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export const exportStatementToPdf = async (elementId: string, customFileName?: string) => {
    const input = document.getElementById(elementId);
    if (!input) {
        toast.error('Unable to locate statement layout.');
        return;
    }
    
    toast.loading('Generating PDF Statement...', { id: 'pdf-toast' });

    try {
        const originalDisplay = input.style.display;
        const originalPosition = input.style.position;
        const originalLeft = input.style.left;
        const originalTop = input.style.top;

        input.style.display = 'block';
        input.style.position = 'fixed';
        input.style.left = '-10000px';
        input.style.top = '0px';

        await new Promise(resolve => setTimeout(resolve, 50));

        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        input.style.display = originalDisplay;
        input.style.position = originalPosition;
        input.style.left = originalLeft;
        input.style.top = originalTop;

        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        const marginY = 12; 
        const contentPageHeight = pageHeight - marginY * 2;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, pageHeight - marginY, pdfWidth, marginY, 'F');
        
        heightLeft -= (pageHeight - marginY);

        while (heightLeft > marginY + 5) {
            position -= (position === 0 ? (pageHeight - marginY) : contentPageHeight);
            pdf.addPage();
            
            pdf.addImage(imgData, 'PNG', 0, position + marginY, pdfWidth, imgHeight);
            
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, marginY, 'F');
            
            pdf.rect(0, pageHeight - marginY, pdfWidth, marginY, 'F');
            
            heightLeft -= contentPageHeight;
        }

        const totalPages = (pdf as any).internal.getNumberOfPages() || (pdf as any).getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            // Draw precisely inside the bottom 12mm blank-space margin (at 5mm offset from physical bottom)
            pdf.text(`Page ${i} of ${totalPages}`, pdfWidth / 2, pageHeight - 5, { align: 'center' });
        }
        
        const fileName = customFileName 
            ? `${customFileName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`
            : `Financial_Statement_${new Date().toISOString().split('T')[0]}`;
            
        pdf.save(`${fileName}.pdf`);
        
        toast.success('PDF Statement downloaded perfectly!', { id: 'pdf-toast' });
    } catch (err) {
        console.error("PDF generation failed", err);
        if (input) input.style.display = 'none';
        toast.error('Failed to generate PDF. See console.', { id: 'pdf-toast' });
    }
};
