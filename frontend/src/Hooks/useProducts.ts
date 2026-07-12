import { useQuery } from '@tanstack/react-query';

import type { Product } from '../../../shared/sharedTypes';
import { userApi } from '../Library/api';

// Hook 3: Manage deep product catalogs
export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await userApi.get<Product[]>('/products');
            return data;
        },
        // Keep your distinct layout configs right here
        staleTime: 1000 * 60 * 60 * 24, // 24-Hour deep cache strategy
        refetchInterval: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
}
