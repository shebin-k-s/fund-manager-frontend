import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const PDF_CONTENT_WIDTH = 794; // A4 width in screen pixels (96dpi)

export const exportStatementToPdf = async (
    elementId: string,
    customFileName?: string
) => {
    const input = document.getElementById(elementId);

    if (!input) {
        toast.error('Unable to locate statement layout.');
        return;
    }

    toast.loading('Generating PDF Statement...', { id: 'pdf-toast' });

    try {
        // ─── Collect row boundaries ────────────────────────────────────────
        // The element is fixed at top:0, left:-9999px, so containerRect.top ≈ 0.
        // Subtracting containerRect.top from each block's rect.bottom gives
        // the block's bottom offset in DOM pixels relative to the container.
        const containerRect = input.getBoundingClientRect();

        const blockBottoms: number[] = [];
        input.querySelectorAll<HTMLElement>('.transaction-row, .statement-block').forEach(el => {
            const rect = el.getBoundingClientRect();
            blockBottoms.push(rect.bottom - containerRect.top);
        });

        // ─── Capture canvas ────────────────────────────────────────────────
        // Use onclone to reposition the element within the clone document so
        // html2canvas can see the full 794px width regardless of viewport size.
        // We never touch the real DOM.
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: PDF_CONTENT_WIDTH,
            windowWidth: PDF_CONTENT_WIDTH,
            onclone: (_clonedDoc, clonedEl) => {
                clonedEl.style.position = 'absolute';
                clonedEl.style.left = '0';
                clonedEl.style.top = '0';
                clonedEl.style.width = `${PDF_CONTENT_WIDTH}px`;
                clonedEl.style.display = 'block';
                _clonedDoc.body.style.margin = '0';
                _clonedDoc.body.style.padding = '0';
                _clonedDoc.body.style.minWidth = `${PDF_CONTENT_WIDTH}px`;
            }
        });

        // ─── Scale mapping ─────────────────────────────────────────────────
        // canvas.width = PDF_CONTENT_WIDTH * scale = 794 * 2 = 1588
        // DOM pixel → canvas pixel multiplier = scale = 2
        const domToCanvas = canvas.width / containerRect.width; // 1588 / 794 = 2
        const blockBottomsPx = blockBottoms.map(b => b * domToCanvas);

        // ─── PDF setup ─────────────────────────────────────────────────────
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
        const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

        const footerHeightMm = 10;
        const topMarginMm = 0;
        const contentHeightMm = pageHeight - topMarginMm - footerHeightMm;
        const pxPerMm = canvas.width / pdfWidth;             // canvas px per mm
        const usablePageHeightPx = contentHeightMm * pxPerMm;

        // ─── Snap helper ───────────────────────────────────────────────────
        // Find the highest block bottom that still fits on this page so we
        // never cut through a transaction row or summary card.
        function snapToSafeBreak(sliceStart: number, rawEnd: number): number {
            const candidates = blockBottomsPx
                .filter(b => b > sliceStart && b <= rawEnd)
                .sort((a, b) => b - a);

            // Return the last block bottom that fully fits on this page.
            if (candidates.length > 0) return candidates[0];

            // No break point found — single block larger than a page, cut anyway.
            return rawEnd;
        }

        // ─── Paginate ──────────────────────────────────────────────────────
        let y = 0;
        let pageIndex = 0;

        while (y < canvas.height) {
            const remaining = canvas.height - y;
            const isLastPage = remaining <= usablePageHeightPx;

            const sliceEnd = isLastPage
                ? y + remaining
                : snapToSafeBreak(y, y + usablePageHeightPx);

            const sliceHeight = sliceEnd - y;

            // Create a page-sized canvas slice
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.round(usablePageHeightPx);

            const ctx = pageCanvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

            const pageData = pageCanvas.toDataURL('image/png');
            if (pageIndex > 0) pdf.addPage();

            pdf.addImage(pageData, 'PNG', 0, topMarginMm, pdfWidth, contentHeightMm);

            y = sliceEnd;
            pageIndex++;
        }

        // ─── Footer ────────────────────────────────────────────────────────
        const totalPages =
            (pdf as any).internal.getNumberOfPages?.() ??
            (pdf as any).getNumberOfPages?.();

        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, pageHeight - footerHeightMm, pdfWidth, footerHeightMm, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184);
            pdf.text(`Page ${i} of ${totalPages}`, pdfWidth / 2, pageHeight - 3.5, { align: 'center' });
        }

        // ─── Save ──────────────────────────────────────────────────────────
        const fileName = customFileName
            ? `${customFileName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`
            : `Financial_Statement_${new Date().toISOString().split('T')[0]}`;

        pdf.save(`${fileName}.pdf`);
        toast.success('PDF Statement downloaded successfully!', { id: 'pdf-toast' });

    } catch (err) {
        console.error('PDF generation failed', err);
        toast.error('Failed to generate PDF. Check console.', { id: 'pdf-toast' });
    }
};
