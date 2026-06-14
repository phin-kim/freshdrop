import { create } from 'zustand';

import { Coordinates } from '../Types/location';

interface DeliveryState {
    distance: number;
    deliveryFee: number;
    setDeliveryFee: (val: number) => void;
    setDistance: (dist: number) => void;
    coords: Coordinates | undefined;
    setCoords: (coords: Coordinates) => void;
    searchQuery: string;
    selectedCategory: string;
    deliveryLocationInput: string;
    setDeliveryLocationInput: (input: string) => void;
    setSelectedCategory: (cat: string) => void;
    setSearchQuery: (query: string) => void;
    deliveryLocation: string;
    setDeliveryLocation: (location: string) => void;
}
export const useDeliveryStore = create<DeliveryState>((set) => ({
    searchQuery: '',
    distance: 0,
    coords: undefined,
    deliveryLocation: '',
    selectedCategory: 'All Items',
    deliveryFee: 0,
    deliveryLocationInput: '',
    setDeliveryFee: (val) => set({ deliveryFee: val }),
    setDistance: (val: number) => set({ distance: val }),
    setCoords: (values: Coordinates) => set({ coords: values }),
    setDeliveryLocationInput: (input: string) =>
        set({ deliveryLocationInput: input }),
    setSelectedCategory: (cat: string) => set({ selectedCategory: cat }),
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setDeliveryLocation: (location: string) =>
        set({ deliveryLocation: location }),
}));
