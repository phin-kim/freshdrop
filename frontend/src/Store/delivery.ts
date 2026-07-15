// src/Stores/useDeliveryStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ➕ Added imports
import type { Coordinates } from '../Types/location';
import type { AddressDetails } from './addressStore';

interface DeliveryState {
    deliveryDistance: number;
    deliveryFee: number;
    coords: Coordinates | undefined;
    searchQuery: string;
    selectedCategory: string;
    deliveryLocationInput: string;
    deliveryDestination: string;
    address: AddressDetails;
    updateAddressField: (
        field: keyof AddressDetails,
        value: string | boolean
    ) => void;
    setAddress: (address: AddressDetails) => void;
    setDeliveryFee: (val: number) => void;
    setDeliveryDistance: (dist: number) => void;
    setCoords: (coords: Coordinates) => void;
    setDeliveryLocationInput: (input: string) => void;
    setSelectedCategory: (cat: string) => void;
    setSearchQuery: (query: string) => void;
    setDeliveryDestination: (location: string) => void;
}

export const useDeliveryStore = create<DeliveryState>()(
    persist(
        (set) => ({
            searchQuery: '',
            deliveryDistance: 0,
            coords: undefined,
            deliveryDestination: '',
            selectedCategory: 'All Items',
            deliveryFee: 0,
            deliveryLocationInput: '',
            address: {
                id: '',
                apartmentName: '',
                houseNumber: '',
                landmark: '',
                deliveryDestination: '',
                destinationLabel: '',
                isDefault: false,
                customerLatitude: 0.0,
                customerLongitude: 0.0,
            },
            setAddress: (addr) => set({ address: addr }),
            updateAddressField: (field, value) => {
                set((state) => ({
                    address: {
                        ...state.address,
                        [field]: value,
                    },
                }));
            },
            setDeliveryFee: (val) => set({ deliveryFee: val }),
            setDeliveryDistance: (val: number) =>
                set({ deliveryDistance: val }),
            setCoords: (values: Coordinates) => set({ coords: values }),
            setDeliveryLocationInput: (input: string) =>
                set({ deliveryLocationInput: input }),
            setSelectedCategory: (cat: string) =>
                set({ selectedCategory: cat }),
            setSearchQuery: (query: string) => set({ searchQuery: query }),
            setDeliveryDestination: (location: string) =>
                set({ deliveryDestination: location }),
        }),
        {
            name: 'freshdrop-delivery-session', // Key name used inside browser Session Storage
            storage: createJSONStorage(() => sessionStorage), // 🌟 Redirects storage engine to tab sessionStorage

            partialize: (state) => ({
                deliveryDestination: state.deliveryDestination,
                deliveryFee: state.deliveryFee,
                deliveryDistance: state.deliveryDistance,
                coords: state.coords,
                address: state.address,
            }),
        }
    )
);
