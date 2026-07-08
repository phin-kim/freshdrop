import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import type { Product } from '../../../shared/sharedTypes';

// Hook 3: Manage deep product catalogs
export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await axios.get<Product[]>('/api/products');
            return data;
        },
        // Keep your distinct layout configs right here
        staleTime: 1000 * 60 * 60 * 24, // 24-Hour deep cache strategy
        refetchInterval: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
}
