import { useEffect, useState } from 'react';
import api from '@/services/api';

const ENV_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string | undefined;

/**
 * Returns a Mapbox public token, preferring the Vite env value but
 * falling back to a backend-provided token when necessary.
 */
export default function useMapboxToken() {
  const [token, setToken] = useState<string | null>(ENV_TOKEN ?? null);

  useEffect(() => {
    if (token) return;

    let isMounted = true;
    api
      .get('/stores/config')
      .then((res) => {
        const serverToken = res.data?.mapbox_public_token;
        if (isMounted && typeof serverToken === 'string' && serverToken.length > 0) {
          setToken(serverToken);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Mapbox public token from backend', err);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return token;
}








