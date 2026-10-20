'use client';

/**
 * Universal document printing utility for invoices, purchase orders, and waybills.
 * Prints through an isolated hidden iframe to bypass SPA layout constraints,
 * modal clipping, and background page spacing.
 *
 * Implements strict DOM node cloning (importNode) rather than HTML serialization
 * to eliminate DOM-based XSS (CWE-079 / CWE-116) and avoid document.write.
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
    try {
      document.body.removeChild(iframe);
    } catch (_) {}
    window.print();
    return;
  }

  // Set document title safely via DOM property
  iframeDoc.title = documentTitle;

  // Add meta charset
  const metaCharset = iframeDoc.createElement('meta');
  metaCharset.setAttribute('charset', 'utf-8');
  iframeDoc.head.appendChild(metaCharset);

  // Safely clone and import all stylesheets and style tags from the current parent document
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    try {
      const importedNode = iframeDoc.importNode(node, true);
      iframeDoc.head.appendChild(importedNode);
    } catch (_) {}
  });

  // Comprehensive A4 print stylesheet ensuring clean top-to-bottom pagination without empty gaps
  // @page margin: 0 suppresses the browser's default header and footer (URL, date, title, page numbers)
  const printOverrideCss = `
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
  `;

  const overrideStyleEl = iframeDoc.createElement('style');
  overrideStyleEl.textContent = printOverrideCss;
  iframeDoc.head.appendChild(overrideStyleEl);

  // Clear existing body nodes if any
  while (iframeDoc.body.firstChild) {
    iframeDoc.body.removeChild(iframeDoc.body.firstChild);
  }

  // Safely import and clone the target element directly as DOM nodes
  const container = iframeDoc.createElement('div');
  container.className = 'print-container';
  const clonedElement = iframeDoc.importNode(element, true);
  container.appendChild(clonedElement);

  iframeDoc.body.className = 'bg-white text-slate-900';
  iframeDoc.body.appendChild(container);

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
