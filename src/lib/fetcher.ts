import { fetchAuthSession } from 'aws-amplify/auth';
import { env } from '../utils/env';

export class HttpError extends Error {
  status: number;
  statusText: string;
  info?: any;

  constructor(status: number, statusText: string, info?: any) {
    super(`HTTP Error ${status}: ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.info = info;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

interface FetcherOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetcher<T>(path: string, options: FetcherOptions = {}): Promise<T> {
  const { requireAuth = true, ...init } = options;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requireAuth) {
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      if (idToken) {
        headers.set('Authorization', `Bearer ${idToken}`);
      }
    } catch (error) {
      console.warn('Could not fetch auth session in fetcher:', error);
    }
  }

  const baseUrl = env.API_URL || '';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${normalizedBaseUrl}${normalizedPath}`;

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let info: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        info = await response.json();
      } catch (_) {
        // ignore
      }
    } else {
      try {
        info = await response.text();
      } catch (_) {
        // ignore
      }
    }
    throw new HttpError(response.status, response.statusText, info);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  const text = await response.text();
  return text as unknown as T;
}
