export const getBaseApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local');
    // In production browsers (Vercel deployment, HTTPS), use relative /api to avoid Mixed Content errors
    if (!isLocalhost) {
      return '/api';
    }
  }
  return process.env.API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseApiUrl();

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getBaseApiUrl();
  return `${base}${cleanPath}`;
}

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  static async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const baseUrl = getBaseApiUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullPath = `${baseUrl}${cleanEndpoint}`;
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    const url = new URL(fullPath, base);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const token = options.token || this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers,
      });

      if (response.status === 204) {
        return {} as T;
      }

      // Check if binary download (e.g. Excel spreadsheet)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('spreadsheetml')) {
        return (await response.blob()) as unknown as T;
      }

      let json: any = {};
      const isJson = contentType && contentType.includes('application/json');

      if (isJson) {
        try {
          json = await response.json();
        } catch {
          json = {};
        }
      } else {
        const text = await response.text();
        try {
          json = JSON.parse(text);
        } catch {
          json = {
            success: response.ok,
            error: {
              message: response.ok
                ? text
                : `HTTP ${response.status}: Failed to reach API service (received non-JSON response)`,
            },
          };
        }
      }

      if (!response.ok || !json.success) {
        // If 401 Unauthorized, automatically clear stale / expired token from client storage
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }

        const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
        const err = new Error(errorMsg) as any;
        err.code = json.error?.code || 'API_ERROR';
        err.status = response.status;
        err.details = json.error?.details;
        throw err;
      }

      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      // Re-throw formatted error for caller
      throw err;
    }
  }

  static get<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T = any>(endpoint: string, body?: any, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  static put<T = any>(endpoint: string, body?: any, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  static patch<T = any>(endpoint: string, body?: any, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  static delete<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
