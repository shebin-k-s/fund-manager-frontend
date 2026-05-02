import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

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
        const originalDisplay = input.style.display;
        const originalPosition = input.style.position;
        const originalLeft = input.style.left;
        const originalTop = input.style.top;

        input.style.display = 'block';
        input.style.position = 'fixed';
        input.style.left = '-10000px';
        input.style.top = '0px';
        input.style.margin = '0';
        input.style.padding = '0';
        input.style.transform = 'none';

        await new Promise(resolve => setTimeout(resolve, 150));

        // ─── Collect row boundaries BEFORE canvas capture ─────────────────
        // We read the DOM while the element is visible and positioned,
        // so getBoundingClientRect() returns real coordinates.
        const containerRect = input.getBoundingClientRect();

        // Grab every transaction row + the header block so we never
        // cut through the summary card or a row either.
        const avoidBreakEls = input.querySelectorAll<HTMLElement>(
            '.transaction-row, .statement-block'
        );

        // For each element, record its bottom edge in px relative to
        // the top of the container (pre-scale — we'll apply scale after).
        const blockBottoms: number[] = [];
        avoidBreakEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            blockBottoms.push(rect.bottom - containerRect.top);
        });

        // ─── Capture canvas ────────────────────────────────────────────────
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#f8fafc',
            onclone: (doc) => {
                doc.body.style.margin = '0';
                doc.body.style.padding = '0';
                const container = doc.getElementById('dynamic-statement-container');
                if (container) {
                    container.style.margin = '0';
                    container.style.padding = '0';
                    container.style.transform = 'none';
                }
            }
        });

        // Scale factor between DOM pixels and canvas pixels
        const domToCanvas = canvas.width / containerRect.width;

        // Convert all block bottoms to canvas-pixel space
        const blockBottomsPx = blockBottoms.map(b => b * domToCanvas);

        // Restore DOM
        input.style.display = originalDisplay;
        input.style.position = originalPosition;
        input.style.left = originalLeft;
        input.style.top = originalTop;

        // ─── PDF setup ─────────────────────────────────────────────────────
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const footerHeightMm = 12;
        const topMarginMm = 6;
        const contentHeightMm = pageHeight - topMarginMm - footerHeightMm;
        const pxPerMm = canvas.width / pdfWidth;
        const usablePageHeightPx = contentHeightMm * pxPerMm;

        // ─── Snap helper ───────────────────────────────────────────────────
        // Given a page that starts at `sliceStart` and would naively end at
        // `rawEnd`, walk backwards through block boundaries to find the last
        // block that fully fits. This prevents any element being sliced.
        function snapToSafeBreak(sliceStart: number, rawEnd: number): number {
            // Sort descending so we find the largest safe cut first
            const candidates = blockBottomsPx
                .filter(b => b > sliceStart && b <= rawEnd)
                .sort((a, b) => b - a);

            // Best case: last block that fits entirely within this page
            if (candidates.length > 0) return candidates[0];

            // No block boundary found — content is a single unbreakable block
            // bigger than a page. Fall back to raw cut (unavoidable).
            return rawEnd;
        }

        // ─── Paginate ──────────────────────────────────────────────────────
        let y = 0;
        let pageIndex = 0;

        while (y < canvas.height) {
            const remaining = canvas.height - y;
            const isLastPage = remaining <= usablePageHeightPx;

            // On the last page just take what's left, no snapping needed
            const sliceEnd = isLastPage
                ? y + remaining
                : snapToSafeBreak(y, y + usablePageHeightPx);

            const sliceHeight = sliceEnd - y;

            // Draw this slice onto its own canvas
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            // Pad the page canvas to full usable height and fill with
            // bg color so the gap after the last row isn't white
            pageCanvas.height = Math.round(usablePageHeightPx);

            const ctx = pageCanvas.getContext('2d')!;

            // Fill entire page canvas with the background color first
            ctx.fillStyle = '#0f172a'; // slate-900
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

            // Then draw the actual content slice on top
            ctx.drawImage(
                canvas,
                0, y,
                canvas.width, sliceHeight,
                0, 0,
                canvas.width, sliceHeight
            );

            const pageData = pageCanvas.toDataURL('image/png');
            if (pageIndex > 0) pdf.addPage();

            // Full usable height in mm so the image fills the content area
            const imgHeightMm = contentHeightMm;
            pdf.addImage(pageData, 'PNG', 0, topMarginMm, pdfWidth, imgHeightMm);

            y = sliceEnd;
            pageIndex++;
        }

        // ─── Footer ────────────────────────────────────────────────────────
        const totalPages =
            (pdf as any).internal.getNumberOfPages?.() ??
            (pdf as any).getNumberOfPages?.();

        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // Footer bar — dark to match theme
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, pageHeight - footerHeightMm, pdfWidth, footerHeightMm, 'F');

            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139); // slate-500
            pdf.text(`Page ${i} of ${totalPages}`, pdfWidth / 2, pageHeight - 4, {
                align: 'center'
            });
        }

        // ─── Save ──────────────────────────────────────────────────────────
        const fileName = customFileName
            ? `${customFileName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`
            : `Financial_Statement_${new Date().toISOString().split('T')[0]}`;

        pdf.save(`${fileName}.pdf`);
        toast.success('PDF Statement downloaded successfully!', { id: 'pdf-toast' });

    } catch (err) {
        console.error('PDF generation failed', err);
        const el = document.getElementById(elementId);
        if (el) el.style.display = 'none';
        toast.error('Failed to generate PDF. Check console.', { id: 'pdf-toast' });
    }
};