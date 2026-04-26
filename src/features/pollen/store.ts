import { create } from 'zustand';
import type { Coordinates } from './types';

interface PollenState {
  location: Coordinates | null;
  /** Display name for the current location. null = using live GPS. */
  locationLabel: string | null;
  locationPermissionDenied: boolean;
  setLocation: (coords: Coordinates) => void;
  setLocationWithLabel: (coords: Coordinates, label: string) => void;
  /** Resets to GPS by clearing location — useLocation will re-fetch automatically. */
  clearCustomLocation: () => void;
  setLocationPermissionDenied: (denied: boolean) => void;
}

export const usePollenStore = create<PollenState>((set) => ({
  location: null,
  locationLabel: null,
  locationPermissionDenied: false,
  setLocation: (location) => set({ location, locationLabel: null }),
  setLocationWithLabel: (location, locationLabel) => set({ location, locationLabel }),
  clearCustomLocation: () =>
    set({ location: null, locationLabel: null, locationPermissionDenied: false }),
  setLocationPermissionDenied: (locationPermissionDenied) =>
    set({ locationPermissionDenied }),
}));
