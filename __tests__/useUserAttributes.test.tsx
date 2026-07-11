import { renderHook, waitFor } from '@testing-library/react';
import { useUserAttributes, useCustomAttribute } from '../src/hooks/useUserAttributes';
import { fetchUserAttributes } from 'aws-amplify/auth';

jest.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: jest.fn(),
}));

describe('useUserAttributes hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUserAttributes', () => {
    it('should fetch user attributes on mount', async () => {
      const mockAttributes = {
        email: 'test@example.com',
        'custom:role': 'admin',
      };
      (fetchUserAttributes as jest.Mock).mockResolvedValue(mockAttributes);

      const { result } = renderHook(() => useUserAttributes());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.attributes).toEqual(mockAttributes);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when fetching attributes', async () => {
      const mockError = new Error('Failed to fetch');
      (fetchUserAttributes as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUserAttributes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.attributes).toBeNull();
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useCustomAttribute', () => {
    it('should return a custom attribute when provided with prefix', async () => {
      const mockAttributes = {
        email: 'test@example.com',
        'custom:role': 'admin',
      };
      (fetchUserAttributes as jest.Mock).mockResolvedValue(mockAttributes);

      const { result } = renderHook(() => useCustomAttribute('custom:role'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.value).toBe('admin');
      expect(result.current.error).toBeNull();
    });

    it('should return a custom attribute and automatically prepend custom: if omitted', async () => {
      const mockAttributes = {
        email: 'test@example.com',
        'custom:role': 'admin',
      };
      (fetchUserAttributes as jest.Mock).mockResolvedValue(mockAttributes);

      const { result } = renderHook(() => useCustomAttribute('role'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.value).toBe('admin');
      expect(result.current.error).toBeNull();
    });
  });
});
