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
        // Capture offscreen element with 2x resolution
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        
        // A4 format dimensions in mm
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        // Calculate height proportional to original canvas and A4 width
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        const fileName = customFileName 
            ? `${customFileName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`
            : `Financial_Statement_${new Date().toISOString().split('T')[0]}`;
            
        pdf.save(`${fileName}.pdf`);
        
        toast.success('PDF Statement downloaded perfectly!', { id: 'pdf-toast' });
    } catch (err) {
        console.error("PDF generation failed", err);
        toast.error('Failed to generate PDF. See console.', { id: 'pdf-toast' });
    }
};
