import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { usePollenStore } from '../store';
import type { Coordinates } from '../types';

interface UseLocationResult {
  location: Coordinates | null;
  permissionDenied: boolean;
  loading: boolean;
}

export function useLocation(): UseLocationResult {
  const { location, locationPermissionDenied, setLocation, setLocationPermissionDenied } =
    usePollenStore();
  const [loading, setLoading] = useState(!location && !locationPermissionDenied);

  useEffect(() => {
    if (location || locationPermissionDenied) return;

    let cancelled = false;

    async function requestAndFetch() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        setLoading(false);
        return;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      } catch {
        // Location unavailable — permission granted but hardware failed
        setLocationPermissionDenied(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    requestAndFetch();
    return () => {
      cancelled = true;
    };
  }, [location, locationPermissionDenied, setLocation, setLocationPermissionDenied]);

  return { location, permissionDenied: locationPermissionDenied, loading };
}
