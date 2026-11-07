import { create } from 'zustand';

interface BannerType {
    isOpen: boolean;
    message: string | null;
    title: string | null;
    showBanner: (title: string, message: string) => void;
    closeBanner: () => void;
}

export const useBannerStore = create<BannerType>((set) => ({
    isOpen: false,
    message: null,
    title: null,
    showBanner: (title, message) => set({ isOpen: true, title, message }),
    closeBanner: () => set({ isOpen: false, message: null, title: null }),
}));
