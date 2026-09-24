import { NextResponse } from 'next/server';

const FAWAZ_PRIMARY_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aed.json';
const FAWAZ_FALLBACK_API = 'https://latest.currency-api.pages.dev/v1/currencies/aed.json';

export async function GET() {
  try {
    // Try primary API first
    let response = await fetch(FAWAZ_PRIMARY_API);
    
    // Fallback to secondary API if primary fails
    if (!response.ok) {
      response = await fetch(FAWAZ_FALLBACK_API);
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch currency rates');
    }
    
    const data = await response.json();
    
    // Return the rates in the expected format
    return NextResponse.json({
      success: true,
      data: {
        rates: data.aed || data
      }
    });
    
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    
    // Return default rates as fallback
    const defaultRates = {
      aed: 1.0,
      usd: 0.2723,
      sar: 1.0210,
      eur: 0.2341,
      gbp: 0.2010,
      kwd: 0.0841,
      inr: 25.85,
      pkr: 75.42,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        rates: defaultRates
      }
    });
  }
}