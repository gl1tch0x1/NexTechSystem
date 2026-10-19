'use client';

/**
 * Universal document printing utility for invoices, purchase orders, and waybills.
 * Prints through an isolated hidden iframe to bypass SPA layout constraints,
 * modal clipping, and background page spacing.
 */
export function printDocumentElement(elementId: string, documentTitle: string = 'Document') {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[printDocumentElement] Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Remove any previously orphaned print frames
  const oldFrame = document.getElementById('nextech-print-frame');
  if (oldFrame && oldFrame.parentNode) {
    oldFrame.parentNode.removeChild(oldFrame);
  }

  // Create an isolated invisible iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'nextech-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    console.warn('[printDocumentElement] Could not access iframe document, falling back to window.print()');
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  // Collect all stylesheets and style tags from the current parent document
  const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  // Comprehensive A4 print stylesheet ensuring clean top-to-bottom pagination without empty gaps
  // @page margin: 0 suppresses the browser's default header and footer (URL, date, title, page numbers)
  const printOverrideCss = `
    <style>
      @page {
        size: A4 portrait;
        margin: 0mm !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html {
        margin: 0 !important;
        padding: 0 !important;
      }
      body {
        margin: 0 !important;
        padding: 10mm 12mm !important;
        background: #FFFFFF !important;
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      }
      .print-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #FFFFFF !important;
        color: #0F172A !important;
        overflow: visible !important;
        height: auto !important;
      }
      #printable-ebill,
      #digital-ebill-printable,
      .printable-content,
      .printable-invoice {
        position: static !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
        background: #FFFFFF !important;
        color: #0F172A !important;
        box-shadow: none !important;
        border: none !important;
      }
      .no-print,
      .print\\:hidden,
      button,
      [data-no-print] {
        display: none !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      tr, .avoid-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    </style>
  `;

  // Clone element content and ensure no dark mode class is enforced inside
  const contentHtml = element.outerHTML;

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        ${headStyles}
        ${printOverrideCss}
      </head>
      <body class="bg-white text-slate-900">
        <div class="print-container">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Allow styles and any fonts to resolve before triggering native print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('[printDocumentElement] Error triggering iframe print:', err);
      window.print();
    } finally {
      // Clean up the iframe after the print dialog finishes
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (_) {}
      }, 2500);
    }
  }, 350);
}
