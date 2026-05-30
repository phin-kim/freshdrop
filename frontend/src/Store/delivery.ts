import { create } from 'zustand';

interface DeliveryState {
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
    deliveryLocation: '',
    selectedCategory: 'All Items',
    deliveryLocationInput: '',
    setDeliveryLocationInput: (input: string) =>
        set({ deliveryLocationInput: input }),
    setSelectedCategory: (cat: string) => set({ selectedCategory: cat }),
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setDeliveryLocation: (location: string) =>
        set({ deliveryLocation: location }),
}));
