import { create } from 'zustand';

import type { Product } from '../../../shared/sharedTypes';
import { adminAPI } from '../Library/api';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import useErrorStore from './errorStore';
import useSuccessStore from './successStore';

const log = createClientLogger('adminStore.ts');
interface AdminStates {
    productData: Omit<Product, 'id'>;
    isLoading: boolean;
    setIsLoading: (val: boolean) => void;
    editingProduct: Product | null;
    setEditingProduct: (product: Product | null) => void;
    setProductData: (filed: Partial<Product>) => void;
    handleProductDataChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void;
    resetProductData: () => void;
    toggleStockStatus: (product: Product) => Promise<void>;
    //syncProduct: (sku: string) => Promise<void>;
}
const initialFormState: Omit<Product, 'id'> = {
    sku: '',
    name: '',
    quantityText: '1 unit',
    category: 'Vegetables',
    sourcingType: 'OPEN_MARKET',
    basePrice: 0,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    hubSlug: 'juja-market-hub',
    localPrice: 0,
    stock: 0,
    inStock: true,
    isOrganic: true,
    isSeasonal: false,
};
export const useAdminStore = create<AdminStates>((set) => ({
    productData: initialFormState,
    isLoading: false,
    editingProduct: null,
    setIsLoading: (val) => set({ isLoading: val }),
    setEditingProduct: (prod) => set({ editingProduct: prod }),
    handleProductDataChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, type, value } = event.target;
        const fieldName = name as keyof Omit<Product, 'id'>;

        let calculatedValue: string | number | boolean = value;

        if (type === 'checkbox') {
            calculatedValue = (event.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            calculatedValue = Number(value);
        }

        set((state) => ({
            productData: {
                ...state.productData,
                [fieldName]: calculatedValue,
            } as Omit<Product, 'id'>, // Dynamic runtime key assertion safety
        }));
    },
    setProductData: (fields) => {
        set((state) => ({
            productData: { ...state.productData, ...fields },
        }));
    },
    resetProductData: () => set({ productData: initialFormState }),
    toggleStockStatus: async (product) => {
        set({ isLoading: true });
        const nextStockState = !product.inStock;
        try {
            if (!product.hubId) {
                throw new Error('Product inventory hub is missing');
            }
            await adminAPI.patch('/admin/products/toggle-status', {
                productId: product.id,
                hubId: product.hubId,
                status: nextStockState ? 'IN_STOCK' : 'OUT_OF_STOCK',
            });

            log.info(
                `[FreshDrop Admin API Success] Toggled stock status for product ID ${product.id} to ${nextStockState}`
            );
            useSuccessStore.setState({
                success: `Stock status for "${product.name}" updated to ${nextStockState ? 'IN STOCK' : 'OUT OF STOCK'}.`,
            });
        } catch (error: unknown) {
            log.error(
                `[FreshDrop Admin API Error] Failed to toggle stock status for product ID ${product.id}:`,
                { data: error as Record<string, unknown> }
            );
            const { setError } = useErrorStore.getState();
            handleApiError(error, setError);
            set({ isLoading: false });
        } finally {
            set({
                isLoading: false,
            });
        }
    },
    /*syncProduct: async (sku) => {
        set({ isLoading: true });
        const { productData } = get();
        log.debug('The product data', { data: productData });
        const { mutate: updateInventory, isPending } = useUpdateInventory();
        updateInventory(
            {
                productData,
                sku,
                hubSlug,
            },
            {
                onSuccess: () => {
                    set({ isLoading: false });
                },
                onError: () => {
                    set({ isLoading: false });
                },
            }
        );
        if (isPending) {
            set({ isLoading: true });
        }
        try {
            const res = await adminAPI.post('/admin/products/sync', {
                productData: {
                    ...productData,
                    sku: sku,
                },
                hubSlug,
            });

            log.info(
                '[FreshDrop Admin API Success] Synchronized catalog inventory updates',
                { data: res.data as Record<string, unknown> }
            );

            set({
                isLoading: false,
            });
            useSuccessStore.setState({
                success: `${res.data.data.product.name} has been added successfully`,
            });
        } catch (error: unknown) {
            log.error(
                '[FreshDrop Admin API Error] Failed to execute product synchronization pipeline:',
                { data: error as Record<string, unknown> }
            );
            const { setError } = useErrorStore.getState();
            handleApiError(error, setError);
        } finally {
            set({ isLoading: false });
        }
    },*/
}));
