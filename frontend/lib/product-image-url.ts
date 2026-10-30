/** Preserve signed/percent-encoded URLs; React handles attribute escaping. */
export function productImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input || /[\u0000-\u001f\u007f\\<>"']/.test(input)) return null;
  const relative = input.startsWith('/') && !input.startsWith('//');
  if (!relative && !/^https:\/\//i.test(input)) return null;
  try {
    const url = new URL(input, 'https://nextechsystem.com');
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return relative ? url.pathname + url.search + url.hash : url.href;
  } catch {
    return null;
  }
}
