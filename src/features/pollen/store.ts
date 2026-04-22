import { create } from 'zustand';
import type { Coordinates } from './types';

interface PollenState {
  location: Coordinates | null;
  locationPermissionDenied: boolean;
  setLocation: (coords: Coordinates) => void;
  setLocationPermissionDenied: (denied: boolean) => void;
}

export const usePollenStore = create<PollenState>((set) => ({
  location: null,
  locationPermissionDenied: false,
  setLocation: (location) => set({ location }),
  setLocationPermissionDenied: (locationPermissionDenied) =>
    set({ locationPermissionDenied }),
}));
