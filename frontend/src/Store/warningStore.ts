import { create } from 'zustand';

interface WarningType {
    warning: string | null;
    setWarning: (msg: string | null) => void;
    clearWarning: () => void;
}

const useWarningStore = create<WarningType>((set) => ({
    warning: null,
    setWarning: (msg) => set({ warning: msg }),
    clearWarning: () => set({ warning: null }),
}));

export default useWarningStore;
