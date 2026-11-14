/**
 * WhatsApp integration utility for product availability enquiries.
 * Complies with official https://wa.me/ click-to-chat standards and URL encoding.
 */

export interface WhatsAppEnquiryData {
  productName: string;
  ram?: string | null;
  storage?: string | null;
  quantity: number;
  phone?: string | null;
}

export const DEFAULT_WHATSAPP_NUMBER = '97148006398';

/**
 * Builds the customer enquiry message according to Phase 6 specifications.
 * Dynamically includes RAM and Storage only when applicable; omits irrelevant/empty fields.
 */
export function buildWhatsAppEnquiryText(data: WhatsAppEnquiryData): string {
  const cleanName = (data.productName || 'Hardware Product').trim();
  const cleanQuantity = Math.max(1, Math.floor(Number(data.quantity) || 1));

  const lines: string[] = [
    'Hello, I am interested in the following product:\n',
    `Product Name: ${cleanName}`,
  ];

  if (data.ram && data.ram.trim() && data.ram.trim().toLowerCase() !== 'not applicable') {
    lines.push(`RAM: ${data.ram.trim()}`);
  }

  if (data.storage && data.storage.trim() && data.storage.trim().toLowerCase() !== 'not applicable') {
    lines.push(`Storage: ${data.storage.trim()}`);
  }

  lines.push(`Required Quantity: ${cleanQuantity}\n`);
  lines.push('Could you please confirm its availability and provide the latest pricing?\n');
  lines.push('Thank you.');

  return lines.join('\n');
}

/**
 * Generates an official WhatsApp Click-to-Chat URL with proper URL encoding.
 */
export function generateWhatsAppClickUrl(data: WhatsAppEnquiryData): string {
  const rawPhone = data.phone || '';
  const digitsOnly = rawPhone.replace(/[^0-9]/g, '');
  const cleanPhone = digitsOnly && digitsOnly.length >= 7 ? digitsOnly : DEFAULT_WHATSAPP_NUMBER;
  const messageText = buildWhatsAppEnquiryText(data);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
}
