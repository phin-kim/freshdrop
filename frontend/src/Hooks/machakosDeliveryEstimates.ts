import { useEffect, useState } from 'react';

import useErrorStore from '../Store/errorStore';
import type { Coordinates } from '../Types/location';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import {
    type StoreDeliveryEstimate,
    type StoreId,
    fetchMachakosDeliveryTimes,
} from '../Utils/storeCalculations';

const log = createClientLogger('machakosDeliveryEstimates.ts');
export function useMachakosDeliveryEstimates(userCoords?: Coordinates) {
    const setError = useErrorStore((state) => state.setError);
    const [deliveryEstimates, setDeliveryEstimates] = useState<Record<
        StoreId,
        StoreDeliveryEstimate
    > | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const lat = userCoords?.latitude;
    const lng = userCoords?.longitude;
    useEffect(() => {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            log.warn("No coordinates offered or they aren't numbers");
            return;
        }
        let isMounted = true;
        async function getEstimates() {
            setIsLoading(true);
            try {
                const estimates = await fetchMachakosDeliveryTimes(lng!, lat!);
                if (isMounted) {
                    setDeliveryEstimates(estimates);
                }
            } catch (error) {
                log.error('Failed to fetch delivery estimates');
                handleApiError(error, setError);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        getEstimates();
        return () => {
            isMounted = false;
        };
    }, [setError, userCoords, lat, lng]);
    return {
        deliveryEstimates,
        isLoading,
    };
}
