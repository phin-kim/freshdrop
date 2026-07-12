import { create } from 'zustand';

import { userApi } from '../Library/api';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import useErrorStore from './errorStore';

const log = createClientLogger('useAddressStore.ts');
export interface AddressDetails {
    id: string;
    destinationLabel?: string | null;
    deliveryDestination: string;
    apartmentName: string;
    houseNumber: string;
    landmark: string | null;
    isDefault: boolean;
    customerLatitude: number;
    customerLongitude: number;
}
interface AddressState {
    savedAddresses: AddressDetails[];
    isLoading: boolean;
    fetchAddress: () => void;
}
export const useAddressStore = create<AddressState>((set) => ({
    savedAddresses: [],
    isLoading: false,
    fetchAddress: async () => {
        set({ isLoading: true });
        try {
            const res = await userApi.get('/user/saved-addresses');
            set({ savedAddresses: res.data.savedAddresses });
        } catch (error) {
            log.error('Failed to fetch saved addresses', { data: error });
            const { setError } = useErrorStore.getState();
            handleApiError(error, setError);
        }
    },
}));
