import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { estimateDelivery, type Coordinates, type DeliveryEstimate } from '@/lib/location';

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface DeliveryAddress extends Coordinates {
  label: AddressLabel;
  houseDetails: string;      // House / flat no., floor, building
  landmark?: string;
  formattedAddress: string;  // Address resolved from the map pin
}

interface DeliveryAddressState {
  address: DeliveryAddress | null;
  isSheetOpen: boolean;
  setAddress: (address: DeliveryAddress) => void;
  openSheet: () => void;
  closeSheet: () => void;
}

// The chosen address is kept on this device until the customer changes it
// from the home page, restaurant list, checkout or settings.
export const useDeliveryAddress = create<DeliveryAddressState>()(
  persist(
    (set) => ({
      address: null,
      isSheetOpen: false,
      setAddress: (address) => set({ address, isSheetOpen: false }),
      openSheet: () => set({ isSheetOpen: true }),
      closeSheet: () => set({ isSheetOpen: false }),
    }),
    {
      name: 'shirur-delivery-address',
      partialize: (state) => ({ address: state.address }),
    }
  )
);

export function formatFullAddress(address: DeliveryAddress): string {
  return [
    address.houseDetails,
    address.landmark ? `Near ${address.landmark}` : null,
    address.formattedAddress,
  ].filter(Boolean).join(', ');
}

// First meaningful part of the address for compact headers, e.g. "Baburao Nagar".
export function shortAddress(address: DeliveryAddress): string {
  const parts = address.formattedAddress
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/^[A-Z0-9]{4}\+[A-Z0-9]{2,3}$/.test(part)); // drop plus codes like "R999+FHG"
  return parts.slice(0, 2).join(', ') || address.formattedAddress;
}

export function useDeliveryEstimate(provider?: { latitude?: string | number | null; longitude?: string | number | null } | null): DeliveryEstimate | null {
  const address = useDeliveryAddress((state) => state.address);
  return useMemo(
    () => estimateDelivery(address, provider),
    [address?.lat, address?.lng, provider?.latitude, provider?.longitude]
  );
}
