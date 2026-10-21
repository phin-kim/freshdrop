import type { HubSlug, ProductSource } from '../../../shared/sharedTypes';

export interface HubPreset {
    id: HubSlug;
    name: string;
    tagline?: string;
}
export interface StoreLocationPreset {
    id: ProductSource; // stays the same — your upsert key
    hubId: HubSlug; // which hub this store belongs to
    name: string;
    badge: string;
    logo: string;
    colorBg: string;
    accentBorder: string;
    defaultLocation: string;
    sourcingType: 'OPEN_MARKET' | 'SUPERMARKET';
}
export const HUB_PRESETS: HubPreset[] = [
    { id: 'juja', name: 'Juja', tagline: 'Metropolitan Hub' },
    { id: 'machakos', name: 'Machakos', tagline: 'Eastern Hub' },
];

export const STORE_LOCATION_PRESETS: StoreLocationPreset[] = [
    // ── Machakos ───────────────────────────────────────────────
    {
        id: 'QUICKMART_MACHAKOS',
        hubId: 'machakos',
        name: 'Quickmart',
        badge: 'Express Retail & Deli',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0i3GLqH23ClCnFk33b5y6DVBjChOLniznYlxAN0-L_A&s=10',
        colorBg: 'bg-red-50 text-red-700 border-red-200',
        accentBorder: 'border-red-500',
        defaultLocation: 'Quickmart Machakos Branch',
        sourcingType: 'SUPERMARKET',
    },
    {
        id: 'NAIVAS_MACHAKOS',
        hubId: 'machakos',
        name: 'Naivas Supermarket',
        badge: 'Supermarket Chain',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv5nvrQwE0G8No_VQVOqzfR85sFHr8WJyQ4pkdWUqNGw&s=10',
        colorBg: 'bg-blue-50 text-blue-700 border-blue-200',
        accentBorder: 'border-blue-500',
        defaultLocation: 'Naivas Supermarket - Machakos Branch',
        sourcingType: 'SUPERMARKET',
    },
    {
        id: 'MACHAKOS_OPEN_MARKET',
        hubId: 'machakos',
        name: 'Open Market',
        badge: 'Farm Stalls & Direct Vendors',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ys0t-yA2GkurxH7hQVJot6HIVpFUrGzTI1WWXDQP2g&s=10',
        colorBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        accentBorder: 'border-emerald-600',
        defaultLocation: 'Machakos Central Open Market',
        sourcingType: 'OPEN_MARKET',
    },
    // ── Juja ───────────────────────────────────────────────────
    {
        id: 'JUJA_OPEN_MARKET' as ProductSource,
        hubId: 'juja',
        name: 'Juja Open Market',
        badge: 'Farm Stalls & Direct Vendors',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAN0EqliZ1C9kgcvdh3lT-HkOLRcNeGHTxhKe4WNeeag&s',
        colorBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        accentBorder: 'border-emerald-600',
        defaultLocation: 'Juja Open Market',
        sourcingType: 'OPEN_MARKET',
    },
    {
        id: 'CITADEL_JUJA' as ProductSource,
        hubId: 'juja',
        name: 'Citadel Supermarket',
        badge: 'Supermarket Chain',
        logo: 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=aiIeJotZTGWTLflSz-_AUg&cb_client=search.gws-prod.grass&w=408&h=240&yaw=215.86107&pitch=0&thumbfov=100',
        colorBg: 'bg-amber-50 text-amber-700 border-amber-200',
        accentBorder: 'border-amber-500',
        defaultLocation: 'Citadel Supermarket Juja',
        sourcingType: 'SUPERMARKET',
    },
];

export function storesForHub(hub: HubSlug): StoreLocationPreset[] {
    return STORE_LOCATION_PRESETS.filter((s) => s.hubId === hub);
}

export function hubForStore(id: ProductSource): HubSlug | undefined {
    return STORE_LOCATION_PRESETS.find((s) => s.id === id)?.hubId;
}
