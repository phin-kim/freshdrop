import { create } from 'zustand';
import { User } from '../Types/AuthTypes';
import { Product,CartItem,Order } from '../Types/Product';
import { Toast } from '../Types/generalTypes';
import { INITIAL_PRODUCTS } from '../Library/mockData';
import { calculateServiceCharge } from '../Utils/calculations';
interface StoreState {
  user: User | null;
  session: { id: string; expiresAt: string } | null;
  loading: boolean;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  toasts: Toast[];

  // Authentication (Better-Auth client-side style with LocalStorage sync)
  signIn: (email: string, name: string) => void;
  signUp: (email: string, name: string) => void;
  signOut: () => void;
  setUser: (user: User | null) => void;

  // Cart actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Payhero checkout and Order creation
  submitOrder: (orderData: {
    paymentMethod: "Payhero M-PESA" | "Payhero Card";
    paymentPhone?: string;
    shippingAddress: string;
  }) => boolean;

  // Toast notifications
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
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
    console.error("Error loading local storage state", error);
    return { user: null, orders: [], cart: [] };
  }
};

const localInitial = loadInitialState();

export const useStore = create<StoreState>((set, get) => ({
  user: localInitial.user,
  session: localInitial.user ? { id: 'session_' + Date.now(), expiresAt: new Date(Date.now() + 86450000).toISOString() } : null,
  loading: false,
  products: INITIAL_PRODUCTS,
  cart: localInitial.cart,
  orders: localInitial.orders,
  toasts: [],

  signIn: (email, name) => {
    set({ loading: true });
    setTimeout(() => {
      const mockUser: User = {
        id: 'usr-' + Math.random().toString(36).substr(2, 9),
        email,
        name: name || email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
        createdAt: new Date().toISOString()
      };
      set({
        user: mockUser,
        session: { id: 'sess-' + Math.random().toString(36).substr(2, 9), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() },
        loading: false
      });
      localStorage.setItem('fh_user', JSON.stringify(mockUser));
      get().addToast(`Welcome back, ${mockUser.name}!`, 'success');
    }, 800);
  },

  signUp: (email, name) => {
    set({ loading: true });
    setTimeout(() => {
      const newUser: User = {
        id: 'usr-' + Math.random().toString(36).substr(2, 9),
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
        createdAt: new Date().toISOString()
      };
      set({
        user: newUser,
        session: { id: 'sess-' + Math.random().toString(36).substr(2, 9), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() },
        loading: false
      });
      localStorage.setItem('fh_user', JSON.stringify(newUser));
      get().addToast(`Account created successfully! Welcome, ${newUser.name}.`, 'success');
    }, 1000);
  },

  signOut: () => {
    set({ user: null, session: null });
    localStorage.removeItem('fh_user');
    get().addToast('Successfully signed out of FreshDrop.', 'info');
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('fh_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fh_user');
    }
  },

  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find(item => item.product.id === product.id);
    let newCart: CartItem[];

    if (existing) {
      newCart = cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { product, quantity: 1 }];
    }

    set({ cart: newCart });
    localStorage.setItem('fh_cart', JSON.stringify(newCart));
    get().addToast(`${product.name} added to cart!`, 'success');
  },

  removeFromCart: (productId) => {
    const { cart } = get();
    const target = cart.find(item => item.product.id === productId);
    const newCart = cart.filter(item => item.product.id !== productId);
    set({ cart: newCart });
    localStorage.setItem('fh_cart', JSON.stringify(newCart));
    if (target) {
      get().addToast(`${target.product.name} removed from cart.`, 'info');
    }
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const { cart } = get();
    const newCart = cart.map(item =>
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
    const { cart, clearCart, orders, addToast } = get();
    if (cart.length === 0) {
      addToast("Your cart is empty!", "error");
      return false;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
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
      createdAt: new Date().toISOString()
    };

    const updatedOrders = [newOrder, ...orders];
    set({ orders: updatedOrders });
    localStorage.setItem('fh_orders', JSON.stringify(updatedOrders));
    clearCart();
    addToast(`Order placed successfully with ${paymentMethod}! Total: KSh ${total.toLocaleString()}`, "success");
    return true;
  },

  addToast: (message, type) => {
    const id = Math.random().toString(36).substr(2, 9);
    set(state => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    // Auto remove after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 400);
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }
}));