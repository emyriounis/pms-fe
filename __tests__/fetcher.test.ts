import { fetcher, HttpError } from '../src/lib/fetcher';
import { fetchAuthSession } from 'aws-amplify/auth';

jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}));

jest.mock('../src/utils/env', () => ({
  env: {
    API_URL: 'https://api.example.com',
  },
}));

describe('fetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('performs a basic authenticated GET request and parses JSON response', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({
      tokens: {
        idToken: {
          toString: () => 'mock-token',
        },
      },
    });

    const mockResponseData = { success: true };
    const mockJsonPromise = Promise.resolve(mockResponseData);
    const mockTextPromise = Promise.resolve(JSON.stringify(mockResponseData));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'content-type') return 'application/json';
          return null;
        },
      },
      text: () => mockTextPromise,
      json: () => mockJsonPromise,
    });

    const result = await fetcher('/test-endpoint');

    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/test-endpoint', {
      headers: expect.any(Headers),
    });

    const fetchCallHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers;
    expect(fetchCallHeaders.get('Authorization')).toBe('Bearer mock-token');
    expect(fetchCallHeaders.get('Content-Type')).toBe('application/json');
    expect(result).toEqual(mockResponseData);
  });

  it('allows unauthenticated requests when requireAuth is false', async () => {
    const mockResponseData = { data: 'public' };
    const mockJsonPromise = Promise.resolve(mockResponseData);
    const mockTextPromise = Promise.resolve(JSON.stringify(mockResponseData));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'content-type') return 'application/json';
          return null;
        },
      },
      text: () => mockTextPromise,
      json: () => mockJsonPromise,
    });

    const result = await fetcher('/public-endpoint', { requireAuth: false });

    expect(fetchAuthSession).not.toHaveBeenCalled();
    const fetchCallHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers;
    expect(fetchCallHeaders.get('Authorization')).toBeNull();
    expect(result).toEqual(mockResponseData);
  });

  it('throws an HttpError on non-ok status', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({
      tokens: {},
    });

    const errorResponse = { error: 'Unauthorized access' };
    const mockTextPromise = Promise.resolve(JSON.stringify(errorResponse));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'content-type') return 'application/json';
          return null;
        },
      },
      text: () => mockTextPromise,
      json: () => Promise.resolve(errorResponse),
    });

    let error: any;
    try {
      await fetcher('/private-endpoint');
    } catch (e: any) {
      error = e;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(401);
    expect(error.statusText).toBe('Unauthorized');
    expect(error.info).toEqual(errorResponse);
  });

  it('handles absolute URLs correctly', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({
      tokens: {},
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      text: () => Promise.resolve('plain text response'),
    });

    const result = await fetcher('https://other-domain.com/endpoint');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://other-domain.com/endpoint',
      expect.any(Object),
    );
    expect(result).toBe('plain text response');
  });
});
