import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { estimateDelivery, type Coordinates, type DeliveryEstimate } from '@/lib/location';

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface DeliveryAddress extends Coordinates {
  id: string;
  label: AddressLabel;
  houseDetails: string;      // House / flat no., floor, building
  landmark?: string;
  formattedAddress: string;  // Address resolved from the map pin
}

// What the address sheet should show when it opens.
export type SheetIntent =
  | { step: 'choose' }
  | { step: 'map'; locate?: boolean; pin?: { formattedAddress: string; lat: number; lng: number }; editId?: string };

const MAX_SAVED_ADDRESSES = 5;

interface DeliveryAddressState {
  address: DeliveryAddress | null;          // Address used for delivery right now
  savedAddresses: DeliveryAddress[];
  isSheetOpen: boolean;
  sheetIntent: SheetIntent;
  saveAddress: (address: Omit<DeliveryAddress, 'id'> & { id?: string }) => DeliveryAddress;
  selectAddress: (id: string) => void;
  removeAddress: (id: string) => void;
  openSheet: (intent?: SheetIntent) => void;
  closeSheet: () => void;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Saved addresses are kept on this device; the customer picks one (or adds a new
// one) from the home page, restaurant list, checkout or settings.
export const useDeliveryAddress = create<DeliveryAddressState>()(
  persist(
    (set, get) => ({
      address: null,
      savedAddresses: [],
      isSheetOpen: false,
      sheetIntent: { step: 'choose' },
      saveAddress: (input) => {
        const saved: DeliveryAddress = { ...input, id: input.id || newId() };
        const others = get().savedAddresses.filter((item) => item.id !== saved.id);
        set({
          address: saved,
          savedAddresses: [saved, ...others].slice(0, MAX_SAVED_ADDRESSES),
          isSheetOpen: false,
        });
        return saved;
      },
      selectAddress: (id) => {
        const found = get().savedAddresses.find((item) => item.id === id);
        if (found) set({ address: found, isSheetOpen: false });
      },
      removeAddress: (id) => {
        const { address, savedAddresses } = get();
        const remaining = savedAddresses.filter((item) => item.id !== id);
        set({
          savedAddresses: remaining,
          address: address?.id === id ? remaining[0] ?? null : address,
        });
      },
      // Also used directly as onClick, so ignore anything that isn't an intent (e.g. the click event)
      openSheet: (intent) => set({
        isSheetOpen: true,
        sheetIntent: intent && typeof intent === 'object' && 'step' in intent ? intent : { step: 'choose' },
      }),
      closeSheet: () => set({ isSheetOpen: false }),
    }),
    {
      name: 'shirur-delivery-address',
      version: 1,
      partialize: (state) => ({ address: state.address, savedAddresses: state.savedAddresses }),
      // v0 kept a single address without an id
      migrate: (persisted: any, version) => {
        if (version === 0 && persisted?.address) {
          const address = { ...persisted.address, id: persisted.address.id || newId() };
          return { address, savedAddresses: [address] };
        }
        return persisted;
      },
    }
  )
);

export function formatFullAddress(address: Pick<DeliveryAddress, 'houseDetails' | 'landmark' | 'formattedAddress'>): string {
  return [
    address.houseDetails,
    address.landmark ? `Near ${address.landmark}` : null,
    address.formattedAddress,
  ].filter(Boolean).join(', ');
}

// First meaningful part of the address for compact headers, e.g. "Baburao Nagar".
export function shortAddress(address: Pick<DeliveryAddress, 'formattedAddress'>): string {
  const parts = address.formattedAddress
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}$/.test(part)); // drop plus codes like "R999+FHG"
  return parts.slice(0, 2).join(', ') || address.formattedAddress;
}

export function useDeliveryEstimate(provider?: { latitude?: string | number | null; longitude?: string | number | null } | null): DeliveryEstimate | null {
  const address = useDeliveryAddress((state) => state.address);
  return useMemo(
    () => estimateDelivery(address, provider),
    [address?.lat, address?.lng, provider?.latitude, provider?.longitude]
  );
}
