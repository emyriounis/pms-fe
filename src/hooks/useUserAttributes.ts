import { useState, useEffect } from 'react';
import { fetchUserAttributes, FetchUserAttributesOutput } from 'aws-amplify/auth';

/**
 * Hook to retrieve all attributes of the currently authenticated user.
 */
export function useUserAttributes() {
  const [attributes, setAttributes] = useState<FetchUserAttributesOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAttributes = async () => {
    setLoading(true);
    setError(null);
    try {
      const attrs = await fetchUserAttributes();
      setAttributes(attrs);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  return { attributes, loading, error, refetch: fetchAttributes };
}

/**
 * Hook to retrieve a specific custom attribute of the currently authenticated user.
 * Handles prepending 'custom:' to the attribute name if it is not already present.
 *
 * @param attributeName The name of the custom attribute (e.g. 'role' or 'custom:role')
 */
export function useCustomAttribute(attributeName: string) {
  const [value, setValue] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAttribute = async () => {
      setLoading(true);
      setError(null);
      try {
        const attributes = await fetchUserAttributes();
        if (isMounted) {
          const fullKey = attributeName.startsWith('custom:')
            ? attributeName
            : `custom:${attributeName}`;
          setValue(attributes[fullKey]);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAttribute();

    return () => {
      isMounted = false;
    };
  }, [attributeName]);

  return { value, loading, error };
}
