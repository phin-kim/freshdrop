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
}

export interface CartItem {
  product: Product;
  quantity: number;
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
  createdAt: string;
}


