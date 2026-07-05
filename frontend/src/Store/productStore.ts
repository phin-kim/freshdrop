import { create } from 'zustand';

import type { CartItem, Product } from '../../../shared/sharedTypes';
import { adminAPI } from '../Library/api';
//import { INITIAL_PRODUCTS } from '../Library/mockData';
import type { User } from '../Types/AuthTypes';
import type { DBProductResponse, Order } from '../Types/Product';
import type { Toast } from '../Types/generalTypes';
import handleApiError from '../Utils/apiError';
import { calculateServiceCharge } from '../Utils/calculations';
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
    toasts: Toast[];

    // Authentication (Better-Auth client-side style with LocalStorage sync)

    // Cart actions
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    fetchProducts: () => void;
    // Payhero checkout and Order creation
    submitOrder: (orderData: {
        paymentMethod: 'Payhero M-PESA' | 'Payhero Card';
        paymentPhone?: string;
        shippingAddress: string;
    }) => boolean;

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
    fetchProducts: async () => {
        set({ loading: true });
        try {
            const res = await adminAPI.get('/admin/products');
            const flattenedProducts: Product[] = res.data.data.map(
                (dbProduct: DBProductResponse) => {
                    // Find the hub configurations profile (e.g., Juja Market Hub setup)
                    const localizedHub = dbProduct.hubConfigs?.[0];

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
                            : true,
                        hubSlug: localizedHub?.hub?.slug || 'juja-market-hub',

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

    submitOrder: ({ paymentMethod, paymentPhone, shippingAddress }) => {
        const { cart, clearCart, orders } = get();
        if (cart.length === 0) {
            useErrorStore.setState({
                error: 'Your cart is empty!',
            });
            return false;
        }

        const subtotal = cart.reduce(
            (sum, item) => sum + item.product.localPrice * item.quantity,
            0
        );
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        const { total: serviceCharge } = calculateServiceCharge(totalQty);
        const total = subtotal + serviceCharge;

        const newOrder: Order = {
            id: 'ord-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            items: [...cart],
            subtotal,
            serviceCharge,
            total,
            paymentMethod,
            paymentPhone,
            shippingAddress,
            status: 'Completed', // Simulating successful immediate Payhero transaction
            createdAt: new Date().toISOString(),
        };

        const updatedOrders = [newOrder, ...orders];
        set({ orders: updatedOrders });
        localStorage.setItem('fh_orders', JSON.stringify(updatedOrders));
        clearCart();
        useSuccessStore.setState({
            success: `Order placed successfully with ${paymentMethod}! Total: KSh ${total.toLocaleString()}`,
        });
        return true;
    },
}));
