import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { MdAdd, MdFilterList, MdSearch } from 'react-icons/md';

import type { StoreConfigItem } from '../../../shared/sharedTypes';
import type { ProductSource } from '../../../shared/sharedTypes';
import { useMachakosDeliveryEstimates } from '../Hooks/machakosDeliveryEstimates';
import { adminAPI } from '../Library/api';
import { useAddressStore } from '../Store/addressStore';
import { useDeliveryStore } from '../Store/delivery';
import useErrorStore from '../Store/errorStore';
import { useStore } from '../Store/productStore';
import type {
    DBProductResponse,
    DBStoreProductConfigResponse,
    StoreId,
    StoreOption,
} from '../Types/Product';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import { normalizeAddressCoordinates } from '../Utils/storeCalculations';

const log = createClientLogger('Discovery.tsx');
interface FetchProductsParams {
    pageParam?: string | null;
    hubId?: string;
    storeSlug?: string;
}
const fetchStorefrontProducts = async ({
    pageParam = null,
    hubId,
    storeSlug,
}: FetchProductsParams) => {
    const params = new URLSearchParams();
    if (pageParam) params.append('cursor', pageParam);
    params.append('limit', '20');
    if (hubId) params.append('hubId', hubId);
    if (storeSlug && storeSlug !== 'all') params.append('storeSlug', storeSlug);

    const url = `/user/products?${params.toString()}`;

    try {
        const res = await adminAPI.get(url);
        const mappedProducts = res.data.data.map(
            (dbProduct: DBProductResponse) => {
                // Find the hub configurations profile (e.g., Juja Market Hub setup)
                const activeStoreConfig =
                    dbProduct.storeConfigs?.find(
                        (config: DBStoreProductConfigResponse) =>
                            !storeSlug ||
                            storeSlug === 'all' ||
                            config.store.slug === storeSlug
                    ) || dbProduct.storeConfigs?.[0];

                return {
                    id: dbProduct.id,
                    name: dbProduct.name,
                    sku: dbProduct.sku,
                    category: dbProduct.category,

                    quantityText: dbProduct.quantityText || '1kg, Farm Fresh',
                    basePrice: Number(dbProduct.basePrice || 0),

                    localPrice: Number(
                        activeStoreConfig?.price ?? dbProduct.basePrice ?? 0
                    ),

                    storeConfig: activeStoreConfig
                        ? {
                              price: Number(activeStoreConfig.price),
                              inStock: activeStoreConfig.status === 'IN_STOCK',
                              store: {
                                  id: activeStoreConfig.store.id,
                                  name: activeStoreConfig.store.name,
                                  slug: activeStoreConfig.store.slug,
                                  sourcingType:
                                      activeStoreConfig.store.sourcingType,
                                  rating: activeStoreConfig.store.rating || 4.9,
                              },
                          }
                        : null,
                    storeConfigs:
                        dbProduct.storeConfigs?.map(
                            (sc: DBStoreProductConfigResponse) => ({
                                id: sc.id,
                                price: Number(sc.price),
                                status: sc.status,
                                store: sc.store,
                            })
                        ) || [],
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
        return {
            data: mappedProducts,
            nextCursor: res.data.nextCursor,
        };
    } catch (error) {
        log.error('Error in fetching products', { data: { error } });
        throw error;
    }
};
const STORE_OPTIONS: StoreOption[] = [
    {
        id: 'QUICKMART',
        slug: 'QUICKMART',
        name: 'Quickmart',
        shortName: 'Quickmart',
        badge: 'Express Retail & Deli',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0i3GLqH23ClCnFk33b5y6DVBjChOLniznYlxAN0-L_A&s=10',
        description:
            'Fresh bakery baguettes & croissants baked hourly, hot rotisserie deli chicken, pre-washed tossed salads, pasteurized milk bottles & cold-pressed juices.',
        deliveryTime: '15–25 mins',
        rating: 4.8,
        ordersCount: '1.4k+ orders',
        accentBg: 'bg-red-600',
        accentText: 'text-red-700',
        tagline: 'Fresh & Easy • Daily Bakery & Hot Deli',
        specialty: [
            'French Baguettes',
            'Hot Deli Chicken',
            'Salad Bowls',
            'Cold Juices',
        ],
    },
    {
        id: 'NAIVAS',
        slug: 'NAIVAS',
        name: 'Naivas Supermarket',
        shortName: 'Naivas',
        badge: 'Supermarket Chain',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv5nvrQwE0G8No_VQVOqzfR85sFHr8WJyQ4pkdWUqNGw&s=10',
        description:
            'Kenya’s premier retail chain. Prime butchery beef steaks, dairy pouches, 2kg unga/rice bags, pure cooking oil, cheddar cheese & packaged kitchen groceries.',
        deliveryTime: '25–40 mins',
        rating: 4.9,
        ordersCount: '3.1k+ orders',
        accentBg: 'bg-blue-600',
        accentText: 'text-blue-700',
        tagline: 'Supermarket Value • Prime Butcher & Pantry',
        specialty: [
            'Prime Beef Steaks',
            'Pantry Unga & Rice',
            'Cooking Oils',
            'Dairy Pouches',
        ],
    },
    {
        id: 'OPEN_MARKET',
        slug: 'OPEN_MARKET',
        name: 'Open Market',
        shortName: 'Open Market',
        badge: 'Machakos Farm Stalls',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ys0t-yA2GkurxH7hQVJot6HIVpFUrGzTI1WWXDQP2g&s=10',
        description:
            'Direct open-air farm stalls and mama mboga traders. Farm-gate prices on huge sukuma wiki bunches, fresh spinach, ripe tomatoes in tenga baskets, avocados & tubers.',
        deliveryTime: '20–35 mins',
        rating: 4.9,
        ordersCount: '2.8k+ orders',
        accentBg: 'bg-[#006e1c]',
        accentText: 'text-[#006e1c]',
        tagline: 'Direct Farm Stalls • Mama Mboga Wholesale',
        specialty: [
            'Fresh Sukuma Wiki',
            'Tenga Tomatoes',
            'Machakos Spinach',
            'Creamy Hass Avocados',
        ],
    },
];
export default function TabDiscovery() {
    const [isSwitchingStore, setIsSwitchingStore] = useState(false);
    const [selectedStore, setSelectedStore] = useState('');
    const setError = useErrorStore((state) => state.setError);
    const addToCart = useStore((state) => state.addToCart);
    const savedAddresses = useAddressStore((state) => state.savedAddresses);

    const defaultAddress =
        savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    const deliveryStoreCoords = useDeliveryStore((state) => state.coords);
    const userCoords =
        deliveryStoreCoords ?? normalizeAddressCoordinates(defaultAddress);
    const { deliveryEstimates, isLoading } =
        useMachakosDeliveryEstimates(userCoords);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
    } = useInfiniteQuery({
        queryKey: ['products'],
        queryFn: fetchStorefrontProducts,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
    });
    const handleSelectStore = (storeId: ProductSource) => {
        if (selectedStore === storeId) return;
        setIsSwitchingStore(true);
        setSelectedStore(storeId);
        setTimeout(() => {
            setIsSwitchingStore(false);
        }, 280);
    };

    const activeStoreDetail: StoreOption | undefined = STORE_OPTIONS.find(
        (store: StoreOption) => store.id === selectedStore
    );
    useEffect(() => {
        if (error) {
            handleApiError(error, setError);
        }
    }, [error, setError]);
    // 1. Flatten TanStack's cache directly in the component stream
    // This naturally appends page 2, page 3, etc., automatically as they arrive!
    const serverProducts = useMemo(() => {
        return data?.pages.flatMap((page) => page?.data) || [];
    }, [data]);
    const searchQuery = useDeliveryStore((state) => state.searchQuery);
    const setSearchQuery = useDeliveryStore((state) => state.setSearchQuery);
    const selectedCategory = useDeliveryStore(
        (state) => state.selectedCategory
    );
    const setSelectedCategory = useDeliveryStore(
        (state) => state.setSelectedCategory
    );
    const [sortBy, setSortBy] = useState('Price: Low to High');
    //const [selectedCategory, setSelectedCategory] = useState('All Items');
    const categoryTabs = [
        'All Items',
        'Fruits',
        'Vegetables',
        'Dairy',
        'Bakery',
        'Household',
    ];
    const storeCounts = useMemo(() => {
        const counts: Record<StoreId, number> = {
            QUICKMART: 0,
            NAIVAS: 0,
            OPEN_MARKET: 0,
        };
        let outOfStock = 0;

        for (const product of serverProducts ?? []) {
            const associatedSlugs = new Set<string>();

            if (product.storeSlug) {
                associatedSlugs.add(String(product.storeSlug).toUpperCase());
            }

            if (Array.isArray(product.storeConfigs)) {
                product.storeConfigs.forEach((cfg: StoreConfigItem) => {
                    if (cfg?.store?.slug) {
                        associatedSlugs.add(
                            String(cfg.store.slug).toUpperCase()
                        );
                    }
                });
            }

            associatedSlugs.forEach((slug) => {
                if (slug in counts) counts[slug as StoreId]++;
            });

            const st = product.stock ?? 50;
            const isInstk = product.inStock ?? true;
            if (!isInstk || st === 0) outOfStock++;
        }

        return {
            total: serverProducts?.length ?? 0,
            byStore: counts,
            outOfStock,
        };
    }, [serverProducts]);
    const normalizedProducts = useMemo(() => {
        return serverProducts.map((p) => {
            // Grab the first store config as the default view reference
            const activeConfig =
                selectedStore && selectedStore !== 'all'
                    ? p.storeConfigs?.find(
                          (c: StoreConfigItem) =>
                              c.store?.slug?.toUpperCase() ===
                              selectedStore.toUpperCase()
                      )
                    : p.storeConfigs?.[0];
            const storeSlug = activeConfig?.store?.slug || 'OPEN_MARKET';

            return {
                ...p,
                // 1. Flatten store details to root so filters/tabs can read them
                storeSlug: storeSlug.toUpperCase(),
                storeSource: storeSlug.toLowerCase(),

                // 2. Derive boolean inStock from the store config status
                inStock: activeConfig
                    ? activeConfig.status === 'IN_STOCK'
                    : true,

                // 3. Parse string prices into actual numbers for sorting/display
                localPrice: Number(activeConfig?.price ?? p.basePrice ?? 0),
                basePrice: Number(p.basePrice ?? 0),
            };
        });
    }, [serverProducts, selectedStore]);
    // Filtered products list for Discovery and Search views
    const filteredProducts = useMemo(() => {
        // Read directly from the flattened server array instead of Zustand 'products'
        let list = [...normalizedProducts];
        if (selectedStore && selectedStore !== 'all') {
            const targetStore = selectedStore.toUpperCase();
            list = list.filter((p) =>
                p.storeConfigs?.some(
                    (config: StoreConfigItem) =>
                        config.store?.slug?.toUpperCase() === targetStore
                )
            );
        }

        // Filter by Search Query
        if (searchQuery.trim().length > 0) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q) ||
                    p.quantityText.toLowerCase().includes(q)
            );
        }

        // Filter by Category
        if (selectedCategory !== 'All Items') {
            list = list.filter((p) => p.category === selectedCategory);
        }

        // Apply Sorting logic
        if (sortBy === 'Price: Low to High') {
            list.sort((a, b) => a.localPrice - b.localPrice);
        } else if (sortBy === 'localPrice: High to Low') {
            list.sort((a, b) => b.localPrice - a.localPrice);
        } else if (sortBy === 'Rating') {
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === 'Organic First') {
            list.sort((a, b) => (b.isOrganic ? 1 : 0) - (a.isOrganic ? 1 : 0));
        }

        return list;
    }, [
        searchQuery,
        selectedCategory,
        sortBy,
        normalizedProducts,
        selectedStore,
    ]);
    const availableProducts = filteredProducts.filter((p) => p.inStock);

    if (status === 'pending') {
        return (
            <div className="py-20 text-center font-semibold text-slate-500">
                Loading farm-fresh groceries...
            </div>
        );
    }
    const getStoreBadgeColor = (source?: ProductSource) => {
        switch (source) {
            case 'QUICKMART':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'NAIVAS':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'OPEN_MARKET':
            default:
                return 'bg-emerald-50 text-[#006e1c] border-emerald-200';
        }
    };

    if (status === 'error') {
        setError('Something went wrong. Please refresh the page.');
        return;
    }
    return (
        <div className="animate-fade-in mx-auto max-w-7xl space-y-8 px-2 pb-16 sm:px-4">
            {/* ================= STORE SELECTION SECTION ================= */}
            <section className="space-y-4 pt-2">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-2xl font-bold text-[#006e1c]">
                                storefront
                            </span>
                            <span className="text-[11px] font-black tracking-widest text-[#006e1c] uppercase">
                                FreshDrop Source Selection
                            </span>
                        </div>
                        <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                            Select Your Store or Market
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                            Choose where you want your products sourced from:
                            Quickmart, Naivas Supermarket, or Open Market.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleSelectStore('all')}
                            className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-black tracking-wider uppercase transition-all ${
                                selectedStore === 'all'
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            Browse All Stores ({storeCounts.total})
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                    {STORE_OPTIONS.map((store: StoreOption) => {
                        const isSelected = selectedStore === store.id;
                        const storeKey = store.slug?.toUpperCase() as StoreId;
                        const count = storeCounts.byStore[storeKey] || 0;
                        const dynamicEstimate = deliveryEstimates?.[storeKey];
                        const displayDeliveryTime = dynamicEstimate
                            ? dynamicEstimate.deliveryTimeWindow
                            : store.deliveryTime;

                        return (
                            <div
                                key={store.id}
                                onClick={() => handleSelectStore(store.id)}
                                className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border-2 bg-white transition-all duration-300 ${
                                    isSelected
                                        ? '-translate-y-1 scale-[1.01] border-transparent shadow-xl ring-4 ring-offset-2 ' +
                                          (store.id === 'QUICKMART'
                                              ? 'border-red-500 ring-red-500'
                                              : store.id === 'NAIVAS'
                                                ? 'border-blue-500 ring-blue-500'
                                                : 'border-[#006e1c] ring-[#006e1c]')
                                        : 'border-slate-200/90 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg'
                                }`}
                            >
                                <div className="relative h-44 w-full overflow-hidden bg-slate-100 sm:h-48">
                                    <img
                                        src={store.image}
                                        alt={store.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>

                                    <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                                        <span className="rounded-full border border-white/40 bg-white/95 px-2.5 py-1 text-[10px] font-black tracking-wider text-slate-900 uppercase shadow-sm backdrop-blur-md">
                                            {store.badge}
                                        </span>

                                        {isSelected && (
                                            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black tracking-wider text-emerald-700 uppercase shadow-md">
                                                <span className="material-symbols-outlined text-sm font-bold">
                                                    check_circle
                                                </span>
                                                ACTIVE STORE
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute right-3 bottom-3 left-3 text-white">
                                        <h3 className="text-xl leading-tight font-black tracking-tight drop-shadow-sm">
                                            {store.name}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-200">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-amber-400">
                                                    schedule
                                                </span>
                                                {isLoading
                                                    ? 'Calculating'
                                                    : displayDeliveryTime}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-amber-300">
                                                <span className="material-symbols-outlined text-sm">
                                                    star
                                                </span>
                                                {store.rating}
                                            </span>
                                            <span>•</span>
                                            <span className="text-white/80">
                                                {count} items
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col justify-between space-y-3 p-4 sm:p-5">
                                    <p className="line-clamp-2 text-xs leading-relaxed font-medium text-slate-600">
                                        {store.description}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                        <div className="flex flex-wrap gap-1">
                                            {store.specialty
                                                .slice(0, 2)
                                                .map(
                                                    (
                                                        item: string,
                                                        idx: number
                                                    ) => (
                                                        <span
                                                            key={idx}
                                                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500"
                                                        >
                                                            {item}
                                                        </span>
                                                    )
                                                )}
                                        </div>

                                        <button
                                            type="button"
                                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black tracking-wider uppercase transition-all ${
                                                isSelected
                                                    ? store.id === 'QUICKMART'
                                                        ? 'bg-red-600 text-white'
                                                        : store.id === 'NAIVAS'
                                                          ? 'bg-blue-600 text-white'
                                                          : 'bg-[#006e1c] text-white'
                                                    : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                                            }`}
                                        >
                                            <span>
                                                {isSelected
                                                    ? 'Viewing Items'
                                                    : 'Select Store'}
                                            </span>
                                            <span className="material-symbols-outlined text-sm">
                                                arrow_forward
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ================= ACTIVE STORE BANNER ================= */}
            {activeStoreDetail && (
                <div
                    className={`rounded-3xl border p-4 transition-all sm:p-5 ${
                        activeStoreDetail.id === 'QUICKMART'
                            ? 'border-red-200 bg-gradient-to-r from-red-50 to-amber-50'
                            : activeStoreDetail.id === 'NAIVAS'
                              ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
                              : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
                    }`}
                >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md sm:h-16 sm:w-16">
                                <img
                                    src={activeStoreDetail.image}
                                    alt={activeStoreDetail.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                                            activeStoreDetail.id === 'QUICKMART'
                                                ? 'bg-red-600 text-white'
                                                : activeStoreDetail.id ===
                                                    'NAIVAS'
                                                  ? 'bg-blue-600 text-white'
                                                  : 'bg-[#006e1c] text-white'
                                        }`}
                                    >
                                        {activeStoreDetail.badge}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        Open Now • Dispatch in{' '}
                                        {activeStoreDetail.deliveryTime}
                                    </span>
                                </div>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                                    Loading Products from{' '}
                                    {activeStoreDetail.name}
                                </h2>
                                <p className="mt-0.5 max-w-2xl text-xs font-medium text-slate-600">
                                    {activeStoreDetail.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                onClick={() => handleSelectStore('all')}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-100"
                            >
                                Clear Store Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <section className="border-outline-variant/25 flex flex-col border-b py-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="font-caveat text-primary mb-1 text-[38px] font-bold">
                        Explore Products ({availableProducts.length})
                    </h2>
                    <p className="text-outline text-xs font-semibold tracking-wider uppercase">
                        Filtered by: {selectedCategory} • Sorting: {sortBy}
                    </p>
                </div>

                {/* Sorting select container */}
                <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">
                    <div className="text-on-surface-variant flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                        <span className="material-symbols-outlined text-base">
                            <MdFilterList />
                        </span>
                        <span>Sort By:</span>
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="focus:ring-primary rounded-xl border border-[#becab9]/50 bg-white px-3 py-2 text-xs font-bold focus:ring-2 focus:outline-none"
                    >
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Rating</option>
                        <option>Organic First</option>
                    </select>
                </div>
            </section>

            {/* Categories Chips horizontal scroll */}
            <div className="custom-scrollbar no-scrollbar flex gap-2.5 overflow-x-auto pb-2">
                {categoryTabs.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-full border px-5 py-2.5 text-xs font-black tracking-wider whitespace-nowrap uppercase shadow-sm transition-all ${
                            selectedCategory === cat
                                ? 'bg-primary border-primary text-white'
                                : 'text-on-surface border-[#becab9]/40 bg-white hover:bg-emerald-50/40'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Combined Discovery Instant Search Filter */}
            <div className="relative">
                <span className="material-symbols-outlined text-outline absolute top-1/2 left-4 -translate-y-1/2 text-xl">
                    <MdSearch />
                </span>
                <input
                    type="text"
                    placeholder="Search fresh produce in current category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="focus:ring-primary w-full rounded-xl border border-[#becab9]/40 bg-white py-3 pr-4 pl-12 text-sm shadow-sm transition-all outline-none focus:border-transparent focus:ring-2"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-outline hover:text-on-surface absolute top-1/2 right-4 -translate-y-1/2 focus:outline-none"
                    >
                        <span className="material-symbols-outlined text-lg">
                            cancel
                        </span>
                    </button>
                )}
            </div>

            {/* Core Products Grid (Asymmetric layout) */}
            {isSwitchingStore ? (
                <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-8 py-20 text-center shadow-sm">
                    <div className="relative mx-auto h-12 w-12">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-[#006e1c]"></div>
                    </div>
                    <h3 className="text-base font-black text-slate-800">
                        Loading products from{' '}
                        {activeStoreDetail?.name || 'store'}...
                    </h3>
                    <p className="mx-auto max-w-sm text-xs font-medium text-slate-500">
                        Fetching direct catalog items, fresh daily pricing, and
                        live inventory.
                    </p>
                </div>
            ) : availableProducts.length === 0 ? (
                <div className="mx-auto max-w-lg space-y-4 rounded-2xl border bg-white p-12 text-center shadow-sm">
                    <span className="material-symbols-outlined text-6xl font-bold text-amber-500">
                        search_off
                    </span>
                    <h3 className="text-lg font-bold">
                        No Fresh Products Match Your Search
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                        Try refining your filter words, switching the category
                        chip, or resetting filters.
                    </p>
                    <button
                        onClick={() => {
                            setSelectedCategory('All Items');
                            setSearchQuery('');
                        }}
                        className="bg-primary hover:bg-primary-container rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {availableProducts.map((p) => {
                        const storeBadgeClass = getStoreBadgeColor(p.storeSlug);
                        return (
                            <div
                                key={p.id}
                                className="group bg-surface-container-lowest border-outline-variant/20 flex flex-col justify-between overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="relative aspect-square overflow-hidden bg-slate-50">
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Store Source Pill Badge on Product Card */}
                                    <div className="absolute top-2.5 left-2.5">
                                        <span
                                            className={`rounded-lg border bg-white/95 px-2 py-0.5 text-[9px] font-black tracking-wider uppercase shadow-xs backdrop-blur-md ${storeBadgeClass}`}
                                        >
                                            {p.storeSlug === 'QUICKMART'
                                                ? 'Quickmart'
                                                : p.storeSlug === 'NAIVAS'
                                                  ? 'Naivas '
                                                  : 'Open Market'}
                                        </span>
                                    </div>

                                    {/* Organic or Seasonal Indicator */}
                                    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                                        {p.isOrganic && (
                                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[8px] font-black tracking-wider text-white uppercase shadow-xs">
                                                Organic
                                            </span>
                                        )}
                                        {p.isSeasonal && (
                                            <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[8px] font-black tracking-wider text-amber-900 uppercase shadow-xs">
                                                Seasonal
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col justify-between p-4">
                                    <div>
                                        <span className="text-[10px] font-extrabold tracking-widest text-[#3e4a41] uppercase">
                                            {p.category}
                                        </span>
                                        <h3 className="text-on-surface group-hover:text-primary my-1 truncate text-[16px] leading-tight font-bold transition-colors">
                                            {p.name.split('')[0].toUpperCase() +
                                                p.name.slice(1)}
                                        </h3>
                                        <p className="text-outline mb-2 text-xs font-semibold">
                                            {p.quantityText}
                                        </p>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2">
                                        <span className="text-primary text-lg font-black">
                                            {p.localPrice} sh
                                        </span>
                                        <button
                                            onClick={() => addToCart(p)}
                                            className="text-on-background flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 shadow-sm transition-all hover:bg-amber-500 hover:shadow active:scale-90"
                                        >
                                            <span className="material-symbols-outlined font-black">
                                                <MdAdd />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-center pt-4">
                {hasNextPage ? (
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase shadow-sm transition-all hover:bg-slate-50 disabled:opacity-60"
                    >
                        {isFetchingNextPage
                            ? 'Gathering fresh stock...'
                            : 'Load More Products'}
                    </button>
                ) : (
                    <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400 italic">
                        You've explored all our farm-fresh products!
                    </p>
                )}
            </div>
        </div>
    );
}
