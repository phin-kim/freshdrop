import { create } from 'zustand';

import { userApi } from '../Library/api';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import { useDeliveryStore } from './delivery';
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
    hubFees?: HubFee[];
}
interface HubFee {
    id: string;
    addressId: string;
    hubId: string;
    distanceKm: string | number;
    deliveryFee: number;
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
            const defaultAddress =
                res.data.savedAddresses.find(
                    (addr: AddressDetails) => addr.isDefault
                ) ?? res.data.savedAddresses[0];
            if (defaultAddress) {
                const {
                    setAddress,
                    setCoords,
                    setDeliveryFee,
                    setDeliveryDistance,
                    setDeliveryDestination,
                } = useDeliveryStore.getState();
                setAddress(defaultAddress);
                setDeliveryDestination(defaultAddress.deliveryDestination);
                setCoords({
                    lat: defaultAddress.customerLatitude,
                    lng: defaultAddress.customerLongitude,
                });
                const distance = defaultAddress.hubFees?.[0]?.distanceKm;
                if (distance !== undefined)
                    setDeliveryDistance(Number(distance));
                //go for the DB provided fees otherwise leave fee as 0 and let cart request preview tho this will be changed to detect if its 0 we have the user reset the location
                const fee = defaultAddress.hubFees?.[0]?.deliveryFees;
                if (fee !== undefined) setDeliveryFee(Number(fee));
            }
        } catch (error) {
            log.error('Failed to fetch saved addresses', { data: error });
            const { setError } = useErrorStore.getState();
            handleApiError(error, setError);
        }
    },
}));
