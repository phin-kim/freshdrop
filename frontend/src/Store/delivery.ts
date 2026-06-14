import { create } from 'zustand';

import { AddressDetails, Coordinates } from '../Types/location';

interface DeliveryState {
    deliveryDistance: number;
    deliveryFee: number;
    coords: Coordinates | undefined;
    searchQuery: string;
    selectedCategory: string;
    deliveryLocationInput: string;
    deliveryLocation: string;
    address: AddressDetails;
    updateAddressField: (field: keyof AddressDetails, value: string) => void;
    setDeliveryFee: (val: number) => void;
    setDeliveryDistance: (dist: number) => void;
    setCoords: (coords: Coordinates) => void;
    setDeliveryLocationInput: (input: string) => void;
    setSelectedCategory: (cat: string) => void;
    setSearchQuery: (query: string) => void;
    setDeliveryLocation: (location: string) => void;
}
export const useDeliveryStore = create<DeliveryState>((set) => ({
    searchQuery: '',
    deliveryDistance: 0,
    coords: undefined,
    deliveryLocation: '',
    selectedCategory: 'All Items',
    deliveryFee: 0,
    deliveryLocationInput: '',
    address: {
        apartmentName: '',
        houseNumber: '',
        landmark: '',
    },
    updateAddressField: (field, value) =>
        set((state) => ({
            address: {
                ...state.address, // Copy existing values safely
                [field]: value, // Overwrite only the changing field
            },
        })),
    setDeliveryFee: (val) => set({ deliveryFee: val }),
    setDeliveryDistance: (val: number) => set({ deliveryDistance: val }),
    setCoords: (values: Coordinates) => set({ coords: values }),
    setDeliveryLocationInput: (input: string) =>
        set({ deliveryLocationInput: input }),
    setSelectedCategory: (cat: string) => set({ selectedCategory: cat }),
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setDeliveryLocation: (location: string) =>
        set({ deliveryLocation: location }),
}));
