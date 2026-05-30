/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product,  } from '../Types/Product';

// Pre-defined high-quality farm produce products matching the requested mock templates
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Gala Apples',
    category: 'Fruits',
    price: 450, // 450 shillings
    quantityText: '1kg, Farm Fresh',
    isOrganic: true,
    isSeasonal: true,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-2',
    name: 'Baby Spinach',
    category: 'Vegetables',
    price: 320, // 320 shillings
    quantityText: '250g, Organic',
    isOrganic: true,
    isSeasonal: false,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-3',
    name: 'Whole Milk',
    category: 'Dairy',
    price: 285, // 285 shillings
    quantityText: '1L, Local Dairy',
    isOrganic: false,
    isSeasonal: false,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-4',
    name: 'Heritage Carrots',
    category: 'Vegetables',
    price: 195, // 195 shillings
    quantityText: '500g, Handpicked',
    isOrganic: true,
    isSeasonal: true,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-5',
    name: 'Heirloom Tomatoes',
    category: 'Vegetables',
    price: 499, // 499 shillings
    quantityText: 'Locally sourced, 1lb',
    isOrganic: true,
    isSeasonal: false,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-6',
    name: 'Artisan Sourdough',
    category: 'Bakery',
    price: 650, // 650 shillings
    quantityText: 'Hand-kneaded, 1 loaf',
    isOrganic: false,
    isSeasonal: false,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-7',
    name: 'Ruby Strawberries',
    category: 'Fruits',
    price: 720, // 720 shillings
    quantityText: 'Greenhouse grown, 500g',
    isOrganic: true,
    isSeasonal: true,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-8',
    name: 'Tender Asparagus',
    category: 'Vegetables',
    price: 395, // 395 shillings
    quantityText: 'Early harvest, Bunch',
    isOrganic: false,
    isSeasonal: true,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1515471204580-f012613df0d3?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'prod-9',
    name: 'Raw Farm Honey',
    category: 'Household',
    price: 850, // 850 shillings
    quantityText: '500g, Raw Wildflower',
    isOrganic: true,
    isSeasonal: false,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
  }
];







