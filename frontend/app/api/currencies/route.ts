import { NextResponse } from 'next/server';

const DEFAULT_RATES = {
  aed: 1,
  usd: 0.2723,
  sar: 1.021,
  eur: 0.2341,
  gbp: 0.201,
  kwd: 0.0841,
  inr: 25.85,
  pkr: 75.42,
};

export async function GET() {
  try {
    const configured = process.env.API_PROXY_TARGET || process.env.BACKEND_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
    if (!configured) throw new Error('Backend API is not configured');
    const backend = configured.replace(/\/$/, '').replace(/\/api$/, '');
    const response = await fetch(`${backend}/api/currencies`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Currency service returned ${response.status}`);
    const result = await response.json();
    const currencies = result?.data?.currencies;
    if (!Array.isArray(currencies)) throw new Error('Invalid currency service response');
    const rates = Object.fromEntries(currencies.map((currency: { code: string; rateAgainstAED: number }) =>
      [currency.code.toLowerCase(), currency.rateAgainstAED]));
    return NextResponse.json({
      success: true,
      data: { rates },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: { rates: DEFAULT_RATES },
    });
  }
}
