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
        // We preserve originals to restore them
        const originalDisplay = input.style.display;
        const originalPosition = input.style.position;
        const originalLeft = input.style.left;
        const originalTop = input.style.top;

        // Temporarily mount the element unconstrained off-screen
        // This ensures parent 'overflow:hidden' and 'max-w' bounds don't crop the large A4 canvas
        input.style.display = 'block';
        input.style.position = 'fixed';
        input.style.left = '-10000px';
        input.style.top = '0px';

        // Wait a tiny bit for the browser to recalculate the out-of-flow layout
        await new Promise(resolve => setTimeout(resolve, 50));

        // Capture offscreen element with 2x resolution
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Restore original display
        input.style.display = originalDisplay;
        input.style.position = originalPosition;
        input.style.left = originalLeft;
        input.style.top = originalTop;

        const imgData = canvas.toDataURL('image/png');
        
        // A4 format dimensions in mm
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        // Loop and add additional pages if content exceeds one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
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
