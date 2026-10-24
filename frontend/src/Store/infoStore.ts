import { create } from 'zustand';

interface InfoType {
    info: string | null;
    setInfo: (msg: string | null) => void;
    clearInfo: () => void;
}

const useInfoStore = create<InfoType>((set) => ({
    info: null,
    setInfo: (msg) => set({ info: msg }),
    clearInfo: () => set({ info: null }),
}));

export default useInfoStore;
