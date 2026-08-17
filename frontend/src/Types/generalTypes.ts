export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: "Fruits" | "Vegetables" | "Dairy" | "Bakery" | "Household";
  price: number; // in Shillings (sh)
  quantityText: string;
  image: string;
  rating?: number;
  isOrganic?: boolean;
  isSeasonal?: boolean;
  sku?: string;
  stock?: number;
  basePrice?: number;
  inStock?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export type DeliveryStage = 'placed' | 'picked_up' | 'out_for_delivery' | 'delivered';

export interface Merchant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  category: "Fruits" | "Vegetables" | "Dairy" | "Bakery" | "Household" | "Mixed Produce";
  location: string;
  hub: string;
  status: "Active" | "Pending" | "Suspended";
  rating: number;
  productsCount: number;
  commissionRate: number; // e.g. 8 for 8%
  totalPayouts: number; // in KSh
  pendingBalance: number; // in KSh
  joinedDate: string;
  logo?: string;
  description?: string;
}

export type RiderStatus =
  | 'AVAILABLE'
  | 'ON_DELIVERY'
  | 'ON_BREAK'
  | 'OFFLINE';

export const riderStatusOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_DELIVERY', label: 'On Delivery' },
  { value: 'ON_BREAK', label: 'On Break' },
  { value: 'OFFLINE', label: 'Offline' },
] as const;

export function formatRiderStatus(status?: string | null): string {
  const match = riderStatusOptions.find((option) => option.value === status);
  return match?.label ?? 'Offline';
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  dispatchHub?: string | null;
  status: RiderStatus;
  rating?: number | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  userId?: string | null;
  totalDeliveries?: number;
  completedToday?: number;
  currentOrderId?: string;
  avatar?: string;
  joinedDate?: string;
  hubLocation?: string;
}

export interface AppNotification {
  id: string;
  orderId?: string;
  title: string;
  message: string;
  type: 'order_placed' | 'order_picked_up' | 'out_for_delivery' | 'delivered' | 'system';
  read: boolean;
  createdAt: string;
  courierName?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
  paymentMethod: "Payhero M-PESA" | "Payhero Card";
  paymentPhone?: string;
  shippingAddress: string;
  status: "Completed" | "Pending" | "Failed";
  deliveryStage?: DeliveryStage;
  deliveryPin?: string;
  courierName?: string;
  courierPhone?: string;
  estimatedMinutes?: number;
  pickedUpAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  session: { id: string; expiresAt: string } | null;
  loading: boolean;
}
