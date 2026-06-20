import { create } from 'zustand';

import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('Success store');
interface SuccessType {
    success: string | null;
    setSuccess: (msg: string | null) => void;
    clearSuccess: () => void;
}
const useSuccessStore = create<SuccessType>((set) => ({
    success: null,
    setSuccess: (msg) => {
        set({ success: msg });
        log.debug('Success message set', { data: msg });
    },

    clearSuccess: () => set({ success: null }),
}));
export default useSuccessStore;
