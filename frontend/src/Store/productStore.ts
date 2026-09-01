import { create } from 'zustand';

import { HUB_SLUG_BY_SOURCING_TYPE } from '../../../shared/constants';
import type { CartItem, Product } from '../../../shared/sharedTypes';
import { adminAPI } from '../Library/api';
//import { INITIAL_PRODUCTS } from '../Library/mockData';
import type { User } from '../Types/AuthTypes';
import type { Order } from '../Types/Orders';
import type { DBProductResponse } from '../Types/Product';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import useErrorStore from './errorStore';
import useSuccessStore from './successStore';

const log = createClientLogger('ProductStore');

interface StoreState {
    user: User | null;
    session: { id: string; expiresAt: string } | null;
    loading: boolean;
    products: Product[];
    cart: CartItem[];
    orders: Order[];

    // Authentication (Better-Auth client-side style with LocalStorage sync)

    // Cart actions
    toggleProductStockInStore: (
        productId: string,
        updatedInStockValue: boolean
    ) => void;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    fetchProducts: () => void;
    // Payhero checkout and Order creation
    /*submitOrder: (orderData: {
        paymentMethod: 'Payhero M-PESA' | 'Payhero Card';
        paymentPhone?: string;
        shippingAddress: string;
    }) => boolean;*/

    // Toast notifications
}
// Simulated Local Storage initialization helper
const loadInitialState = () => {
    try {
        const savedUser = localStorage.getItem('fh_user');
        const savedOrders = localStorage.getItem('fh_orders');
        const savedCart = localStorage.getItem('fh_cart');

        return {
            user: savedUser ? JSON.parse(savedUser) : null,
            orders: savedOrders ? JSON.parse(savedOrders) : [],
            cart: savedCart ? JSON.parse(savedCart) : [],
        };
    } catch (error) {
        console.error('Error loading local storage state', error);
        return { user: null, orders: [], cart: [] };
    }
};

const localInitial = loadInitialState();

export const useStore = create<StoreState>((set, get) => ({
    user: localInitial.user,
    session: localInitial.user
        ? {
              id: 'session_' + Date.now(),
              expiresAt: new Date(Date.now() + 86450000).toISOString(),
          }
        : null,
    loading: false,
    products: [],
    cart: localInitial.cart,
    orders: localInitial.orders,
    toasts: [],
    toggleProductStockInStore: (
        productId: string,
        updatedInStockValue: boolean
    ) => {
        set((state) => ({
            products: state.products.map((product) =>
                product.id === productId
                    ? { ...product, inStock: updatedInStockValue }
                    : product
            ),
        }));
    },
    fetchProducts: async () => {
        set({ loading: true });

        try {
            const res = await adminAPI.get('/admin/products');
            const flattenedProducts: Product[] = res.data.data.map(
                (dbProduct: DBProductResponse) => {
                    // Find the hub configurations profile (e.g., Juja Market Hub setup)
                    const expectedHubSlug =
                        HUB_SLUG_BY_SOURCING_TYPE[dbProduct.sourcingType];
                    const localizedHub = dbProduct.hubConfigs?.find(
                        (config) => config.hub.slug === expectedHubSlug
                    );

                    return {
                        id: dbProduct.id,
                        name: dbProduct.name,
                        sku: dbProduct.sku,
                        category: dbProduct.category,
                        sourcingType: dbProduct.sourcingType,
                        quantityText:
                            dbProduct.quantityText || '1kg, Farm Fresh',
                        basePrice: Number(dbProduct.basePrice || 0),

                        // 🟢 Extract the nested location states and assign them to your flat keys
                        localPrice: localizedHub
                            ? Number(localizedHub.localPrice)
                            : Number(dbProduct.localPrice || 0),
                        inStock: localizedHub
                            ? localizedHub.status === 'IN_STOCK'
                            : false,
                        hubId: localizedHub?.hubId,
                        hubSlug: localizedHub?.hub.slug,

                        // Fallbacks for optional frontend properties
                        image:
                            dbProduct.image ||
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
                        isOrganic: dbProduct.isOrganic ?? true,
                        isSeasonal: dbProduct.isSeasonal ?? false,
                        stock: dbProduct.stock ?? 50,
                        rating: dbProduct.rating ?? 5.0,
                    };
                }
            );

            set({
                products: flattenedProducts,
                loading: false,
            });
        } catch (error) {
            const { setError } = useErrorStore.getState();
            log.error('Unable to fetch the products', { data: { error } });
            handleApiError(error, setError);
        }
    },
    addToCart: (product) => {
        const { cart } = get();
        const existing = cart.find((item) => item.product.id === product.id);
        let newCart: CartItem[];

        if (existing) {
            newCart = cart.map((item) =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            newCart = [...cart, { product, quantity: 1 }];
        }

        set({ cart: newCart });
        localStorage.setItem('fh_cart', JSON.stringify(newCart));
        useSuccessStore.setState({
            success: `${product.name} added to cart!`,
        });
        //get().addToast(`${product.name} added to cart!`, 'success');
    },

    removeFromCart: (productId) => {
        const { cart } = get();
        const target = cart.find((item) => item.product.id === productId);
        const newCart = cart.filter((item) => item.product.id !== productId);
        set({ cart: newCart });
        localStorage.setItem('fh_cart', JSON.stringify(newCart));
        if (target) {
            useSuccessStore.setState({
                success: `${target.product.name} removed from cart.`,
            });
        }
    },

    updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeFromCart(productId);
            return;
        }
        const { cart } = get();
        const newCart = cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
        );
        set({ cart: newCart });
        localStorage.setItem('fh_cart', JSON.stringify(newCart));
    },

    clearCart: () => {
        set({ cart: [] });
        localStorage.removeItem('fh_cart');
    },
}));
