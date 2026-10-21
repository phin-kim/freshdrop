/*
 *we have both server side and client side filtering
 *for the server side in the product mapping use products and remove the displayed Products
 * also remove the current page and use meta but this means search term wont work and will have to use server side searching
 * FIltered products will also not be in use in server side pagination
 */
import { useQuery } from '@tanstack/react-query';
import {
    AlertTriangle,
    CheckCircle,
    Edit3,
    HelpCircle,
    MapPin,
    Package,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import type { Product, ProductSource } from '../../../../../shared/sharedTypes';
import {
    STORE_LOCATION_PRESETS,
    hubForStore,
} from '../../../Helpers/storePresets';
import {
    useDeleteInventory,
    useToggleInventoryStatus,
    useUpdateInventory,
} from '../../../Hooks/adminSynchronization';
import { adminAPI } from '../../../Library/api';
import { useAdminStore } from '../../../Store/adminStore';
import { useStore } from '../../../Store/productStore';
import type { DBProductResponse } from '../../../Types/Product';
import createClientLogger from '../../../Utils/clientLogger';
import { authClient } from '../../../lib/auth-client';
import { AddProductsModal, EditProductsModal } from './AdminComponents';

export type StoreSource = ProductSource | 'all';

const log = createClientLogger('Admin.tsx');
const fetchAdminPageProducts = async (
    page: number,
    limit: number,
    category: string
) => {
    const categoryParam = category !== 'All' ? `&category=${category}` : '';
    const url = `/admin/products?page=${page}&limit=${limit}${categoryParam}`;
    const res = await adminAPI.get(url);
    return res.data; // Returns: { data: [...], meta: { totalPages: X, totalCount: Y } }
};
export default function AdminProductCatalog() {
    //const { products } = useStore();
    //const fetchProducts = useStore((state) => state.fetchProducts);
    const navigate = useNavigate();
    /*useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);*/
    const [selectedStoreFilter, setSelectedStoreFilter] =
        useState<StoreSource>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const { data: session, isPending } = authClient.useSession();

    // States
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data, status, isFetching } = useQuery({
        queryKey: ['admin-products', page, limit, selectedCategory],
        queryFn: () => fetchAdminPageProducts(page, limit, selectedCategory),
        placeholderData: (previousData) => previousData, // Keeps old data on screen while page 2 loads (prevents screen flashing)
    });
    // 1. Safely grab the database array from TanStack Query's structure
    // According to your API comment, the response looks like: { data: [...], meta: {...} }
    const dbProductsRaw: DBProductResponse[] = data?.data ?? [];

    // 2. Map and transform the database structures safely into frontend UI structures
    const products: Product[] = dbProductsRaw.map<Product>(
        (dbProduct: DBProductResponse): Product => {
            const activeConfig = dbProduct.storeConfigs?.[0];

            return {
                id: dbProduct.id,
                name: dbProduct.name,
                sku: dbProduct.sku,
                category: dbProduct.category,
                sourcingType:
                    (activeConfig?.store?.sourcingType as
                        | 'OPEN_MARKET'
                        | 'SUPERMARKET') || 'SUPERMARKET',
                quantityText: dbProduct.quantityText || '1kg, Farm Fresh',
                basePrice: Number(dbProduct.basePrice || 0),

                // 🟢 Extract the nested location states and assign them to your flat keys
                localPrice: activeConfig
                    ? Number(activeConfig.price)
                    : Number(dbProduct.basePrice || 0),
                inStock: activeConfig
                    ? activeConfig.status === 'IN_STOCK'
                    : true,
                storeId: activeConfig?.store?.id || '',
                storeSlug:
                    (activeConfig?.store?.slug as ProductSource) ||
                    'OPEN_MARKET',
                //storeName: activeConfig?.store?.name,

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
    // 3. Extract your total page counters from meta safely
    const meta = data?.meta ?? { totalPages: 1, totalCount: 0 };

    const [searchTerm, setSearchTerm] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    //const [isLoading, setIsLoading] = useState<boolean>(false);
    const { mutateAsync: updateInventory, isPending: updatePending } =
        useUpdateInventory();
    const { mutate: toggleInventoryStatus, isPending: statusPending } =
        useToggleInventoryStatus();
    const { mutate: deleteInventoryItem } = useDeleteInventory();
    const isLoading = useAdminStore((state) => state.isLoading);
    const setProductData = useAdminStore((state) => state.setProductData);
    //const syncProduct = useAdminStore((state) => state.syncProduct);
    const toggleProductStatusInStore = useStore(
        (state) => state.toggleProductStockInStore
    );
    // Track inline row edits: productId -> partial updates
    const [rowChanges, setRowChanges] = useState<
        Record<string, Partial<Product>>
    >({});
    const productData = useAdminStore((state) => state.productData);
    const hasRowChanges = (product: Product) => {
        const changes = rowChanges[product.id];
        if (!changes) return false;
        const changesObj = changes as Partial<Product>;
        for (const key of Object.keys(changesObj) as Array<keyof Product>) {
            if (changesObj[key] !== product[key]) return true;
        }
        return false;
    };

    // Open Edit Form
    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setProductData({
            name: product.name,
            localPrice: product.localPrice,
            quantityText: product.quantityText,
            hubSlug: hubForStore(product.storeSlug) ?? 'juja',
            storeSlug: product.storeSlug,
            category: product.category,
            basePrice:
                product.basePrice || Math.round(product.localPrice * 0.8),
            stock: product.stock !== undefined ? product.stock : 50,
            inStock: product.inStock !== undefined ? product.inStock : true,
            image: product.image,
            isOrganic: !!product.isOrganic,
            isSeasonal: !!product.isSeasonal,
        });
    };

    // Open Add Form
    const openAdd = () => {
        setIsAddOpen(true);
        setProductData({
            sku: '',
            name: '',
            sourcingType: 'OPEN_MARKET', // Default
            storeSlug: 'MACHAKOS_OPEN_MARKET', // Default
            hubSlug: 'machakos',
            localPrice: 150,
            quantityText: '1kg, packet',
            category: 'Vegetables',
            basePrice: 120,
            stock: 1,
            inStock: true,
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
            isOrganic: true,
            isSeasonal: false,
        });
    };

    // API handler simulations with proper try-catch, console output, and visual feedback
    const handleToggleStockStatus = async (product: Product) => {
        const willBeInStock = !product.inStock;
        const backendEnumStatus = willBeInStock ? 'IN_STOCK' : 'OUT_OF_STOCK';

        toggleInventoryStatus({
            product: product,
            backendEnumStatus: backendEnumStatus,
        });
        //updateProduct(product.id, { inStock: !product.inStock });
        toggleProductStatusInStore(product.id, willBeInStock);
    };
    const handleProductsUpdate = async (product: Product) => {
        const updates = rowChanges[product.id];
        if (!updates) return;
        log.debug('The product data', { data: { product } });
        log.debug('The updates made ', { data: updates });
        log.debug(`${typeof updates}: ${updates?.localPrice}`);

        //await syncProduct(product.sku);
        await updateInventory(
            {
                productData,
                sku: product.sku,
            },
            {
                onSuccess: () => {
                    setRowChanges((prev) => {
                        const copy = {
                            ...prev,
                        };
                        delete copy[product.id];
                        return copy;
                    });
                },
            }
        );

        //setSuccess('Saved updates');
    };

    const deleteProduct = async (productName: string, productId: string) => {
        deleteInventoryItem({
            productName,
            productId,
        });
    };

    // Filter products based on search term & category selection
    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
            const pStoreSource =
                product.storeSlug ||
                (product.id.startsWith('Qu')
                    ? 'QUICKMART'
                    : product.id.startsWith('Na')
                      ? 'NAIVAS'
                      : 'OPEN_MARKET');
            const matchesStore =
                selectedStoreFilter === 'all' ||
                pStoreSource === selectedStoreFilter;
            const matchSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.sku &&
                    product.sku
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()));
            const matchCategory =
                selectedCategory === 'All' ||
                product.category === selectedCategory;
            return matchSearch && matchCategory && matchesStore;
        });
    }, [products, searchTerm, selectedCategory, selectedStoreFilter]);
    // The API already returns one page of products, so do not paginate those
    // rows again on the client.
    const displayedProducts = filteredProducts;
    const totalPages = Math.max(meta.totalPages || 0, 1);
    // Aggregate catalog statistics

    const stats = useMemo(() => {
        let quickmartCount = 0;
        let naivasCount = 0;
        let machakosOpenMarketCount = 0;
        let jujaOpenMarketCount = 0;
        let outOfStock = 0;
        let citadelCount = 0;
        //changing this later on such that juja market and machakos remain independent
        // Single pass O(N) loop is faster than running .filter() 3 separate times
        for (const product of products) {
            const slug = product.storeSlug;
            if (slug === 'QUICKMART_MACHAKOS') {
                quickmartCount++;
            } else if (slug === 'NAIVAS_MACHAKOS') {
                naivasCount++;
            } else if (slug === 'MACHAKOS_OPEN_MARKET') {
                machakosOpenMarketCount++;
            } else if (slug === 'JUJA_OPEN_MARKET') {
                jujaOpenMarketCount++;
            } else if (slug === 'CITADEL_JUJA') {
                citadelCount++;
            }
        }
        products.forEach((product: Product) => {
            const st = product.stock !== undefined ? product.stock : 50;
            const isInstk =
                product.inStock !== undefined ? product.inStock : true;

            if (!isInstk || st === 0) {
                outOfStock++;
            }
        });

        return {
            total: products.length,
            quickmartCount,
            citadelCount,
            naivasCount,
            outOfStock,
            jujaOpenMarketCount,
            machakosOpenMarketCount,
        };
    }, [products]);
    useEffect(() => {
        // If loading is finished and they are either not logged in OR not an admin
        if (!session || session.user.role !== 'admin') {
            // Boot them back to the main shop or login page instantly
            navigate('/discovery');
        }
    }, [session, navigate]);

    if (isPending) return <div>Checking authorization...</div>;
    if (session?.user.role !== 'admin') return null;
    if (status === 'pending')
        return (
            <div className="p-8 text-center text-xs">
                Loading table state...
            </div>
        );
    return (
        <div className="animate-fade-in space-y-6 pb-12" id="admin-panel-page">
            {/* Admin Title Block */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
                <div>
                    <h1 className="font-caveat text-on-surface flex items-center gap-2 text-[38px] leading-tight font-black">
                        <Package className="h-4 w-4 text-emerald-600" />
                        Produce Inventory & Catalog
                        {isFetching && (
                            <span className="border-primary ml-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent text-xs" />
                        )}
                    </h1>
                    <p className="text-outline text-sm font-medium">
                        Directly update product pricing, stock availability, SKU
                        tags, and organic certifications.
                    </p>
                </div>

                {/* Quick action triggers */}
                <div className="flex gap-2.5">
                    <button
                        //onClick={handleResetCatalogAPI}
                        disabled={isLoading}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-red-300 px-4 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={isLoading ? 'animate-spin' : ''}
                        />
                        <span>Reset Defaults</span>
                    </button>

                    <button
                        onClick={openAdd}
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#006e1c] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#005313] active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Add Farm Product</span>
                    </button>
                </div>
            </div>

            {/* Stats Bento Grid Panel */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-outline-variant/20 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="rounded-xl bg-emerald-50 p-3 text-[#006e1c]">
                        <Package size={22} />
                    </div>
                    <div>
                        <span className="text-outline block text-xs font-bold tracking-wider uppercase">
                            Total Catalog Items
                        </span>
                        <span className="text-2xl font-black text-slate-800">
                            {meta.totalCount}
                        </span>
                    </div>
                </div>

                <div className="border-outline-variant/20 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
                    <div
                        className={`rounded-xl p-3 ${stats.outOfStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}
                    >
                        <XCircle size={22} />
                    </div>
                    <div>
                        <span className="text-outline block text-xs font-bold tracking-wider uppercase">
                            Flagged Out-of-Stock
                        </span>
                        <span className="text-2xl font-black text-slate-800">
                            {stats.outOfStock} items
                        </span>
                    </div>
                </div>
                {/* Quickmart Sourcing Hub */}
                <div
                    onClick={() =>
                        setSelectedStoreFilter(
                            selectedStoreFilter === 'QUICKMART_MACHAKOS'
                                ? 'all'
                                : 'QUICKMART_MACHAKOS'
                        )
                    }
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                        selectedStoreFilter === 'QUICKMART_MACHAKOS'
                            ? 'border-red-300 bg-red-50/70 ring-2 ring-red-400/30'
                            : 'border-stone-200/80 bg-white shadow-xs hover:border-red-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0i3GLqH23ClCnFk33b5y6DVBjChOLniznYlxAN0-L_A&s=10"
                                alt="Quickmart"
                                className="h-5 w-5 rounded-full border border-red-300 object-cover"
                            />
                            <p className="text-xs font-bold tracking-wider text-red-700 uppercase">
                                Quickmart
                            </p>
                        </div>
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            Express
                        </span>
                    </div>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.quickmartCount}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <MapPin className="inline h-3 w-3 text-red-600" />{' '}
                        Bakery, Deli & Dairy
                    </span>
                </div>

                {/* Naivas Supermarket Sourcing Hub */}
                <div
                    onClick={() =>
                        setSelectedStoreFilter(
                            selectedStoreFilter === 'NAIVAS_MACHAKOS'
                                ? 'all'
                                : 'NAIVAS_MACHAKOS'
                        )
                    }
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                        selectedStoreFilter === 'NAIVAS_MACHAKOS'
                            ? 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-400/30'
                            : 'border-stone-200/80 bg-white shadow-xs hover:border-blue-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv5nvrQwE0G8No_VQVOqzfR85sFHr8WJyQ4pkdWUqNGw&s=10"
                                alt="Naivas"
                                className="h-5 w-5 rounded-full border border-blue-300 object-cover"
                            />
                            <p className="text-xs font-bold tracking-wider text-blue-700 uppercase">
                                Naivas Supermarket
                            </p>
                        </div>
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                            Retail Chain
                        </span>
                    </div>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.naivasCount}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <MapPin className="inline h-3 w-3 text-blue-600" />{' '}
                        Butchery & Pantry Staples
                    </span>
                </div>

                {/* Open Market Sourcing Hub */}
                <div
                    onClick={() =>
                        setSelectedStoreFilter(
                            selectedStoreFilter === 'MACHAKOS_OPEN_MARKET'
                                ? 'all'
                                : 'MACHAKOS_OPEN_MARKET'
                        )
                    }
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                        selectedStoreFilter === 'MACHAKOS_OPEN_MARKET'
                            ? 'border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-400/30'
                            : 'border-stone-200/80 bg-white shadow-xs hover:border-emerald-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ys0t-yA2GkurxH7hQVJot6HIVpFUrGzTI1WWXDQP2g&s=10"
                                alt="Open Market"
                                className="h-5 w-5 rounded-full border border-emerald-300 object-cover"
                            />
                            <p className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                                Open Market
                            </p>
                        </div>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Farm Direct
                        </span>
                    </div>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.machakosOpenMarketCount}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <MapPin className="inline h-3 w-3 text-emerald-600" />{' '}
                        Machakos Vendors
                    </span>
                </div>
                {/* Juja Open Market Sourcing Hub */}
                <div
                    onClick={() =>
                        setSelectedStoreFilter(
                            selectedStoreFilter === 'JUJA_OPEN_MARKET'
                                ? 'all'
                                : 'JUJA_OPEN_MARKET'
                        )
                    }
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                        selectedStoreFilter === 'JUJA_OPEN_MARKET'
                            ? 'border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-400/30'
                            : 'border-stone-200/80 bg-white shadow-xs hover:border-emerald-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAN0EqliZ1C9kgcvdh3lT-HkOLRcNeGHTxhKe4WNeeag&s"
                                alt="Juja Open Market"
                                className="h-5 w-5 rounded-full border border-emerald-300 object-cover"
                            />
                            <p className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                                Juja Market
                            </p>
                        </div>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Farm Direct
                        </span>
                    </div>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.jujaOpenMarketCount}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <MapPin className="inline h-3 w-3 text-emerald-600" />{' '}
                        Juja Town Stalls
                    </span>
                </div>

                {/* Citadel Supermarket Sourcing Hub */}
                <div
                    onClick={() =>
                        setSelectedStoreFilter(
                            selectedStoreFilter === 'CITADEL_JUJA'
                                ? 'all'
                                : 'CITADEL_JUJA'
                        )
                    }
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                        selectedStoreFilter === 'CITADEL_JUJA'
                            ? 'border-amber-300 bg-amber-50/70 ring-2 ring-amber-400/30'
                            : 'border-stone-200/80 bg-white shadow-xs hover:border-amber-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src="https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=aiIeJotZTGWTLflSz-_AUg&cb_client=search.gws-prod.grass&w=408&h=240&yaw=215.86107&pitch=0&thumbfov=100"
                                alt="Citadel"
                                className="h-5 w-5 rounded-full border border-amber-300 object-cover"
                            />
                            <p className="text-xs font-bold tracking-wider text-amber-700 uppercase">
                                Citadel
                            </p>
                        </div>
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            Supermarket
                        </span>
                    </div>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.citadelCount}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <MapPin className="inline h-3 w-3 text-amber-600" />{' '}
                        Juja Town Center
                    </span>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="border-outline-variant/20 flex flex-col items-center justify-between gap-3.5 rounded-2xl border bg-white p-4 shadow-sm md:flex-row">
                {/* Search Input */}
                <div className="relative w-full md:max-w-md">
                    <span className="text-outline absolute top-1/2 left-3.5 -translate-y-1/2">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="border-outline-variant/40 focus:border-primary w-full rounded-xl border bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-colors outline-none focus:bg-white"
                    />
                </div>

                {/* Category Tabs */}
                <div className="flex w-full flex-wrap gap-2.5 md:w-auto">
                    {[
                        'All',
                        'Fruits',
                        'Vegetables',
                        'Dairy',
                        'Bakery',
                        'Household',
                    ].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                setPage(1);
                            }}
                            className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                                selectedCategory === cat
                                    ? 'bg-primary border-primary text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stock Inventory Table */}
            <div className="border-outline-variant/20 overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-outline-variant/15 border-b bg-slate-50 text-[10px] font-black tracking-widest text-[#6B705C] uppercase">
                                <th className="p-4 md:px-6">Product Details</th>
                                <th className="p-4">SKU / Code</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-center">Locations</th>
                                <th className="p-4 text-center">
                                    In-Market Price
                                </th>
                                <th className="p-4 text-center">Base Price</th>

                                <th className="p-4 text-center">Status Flag</th>
                                <th className="p-4 text-right md:pr-6">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-outline-variant/10 divide-y text-sm">
                            {displayedProducts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="text-outline p-12 text-center font-semibold"
                                    >
                                        <div className="mx-auto max-w-xs space-y-2">
                                            <HelpCircle
                                                size={32}
                                                className="text-outline/50 mx-auto"
                                            />
                                            <p>
                                                No inventory items match your
                                                search filters.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setSelectedCategory('All');
                                                }}
                                                className="text-primary text-xs font-bold hover:underline"
                                            >
                                                Reset active filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayedProducts.map((product) => {
                                    const isItemInStock = product.inStock;
                                    const pStoreSource = product.storeSlug;

                                    // 2. Locate the matching store preset (falling back to the third preset if unmatched)
                                    const storePreset =
                                        STORE_LOCATION_PRESETS.find(
                                            (preset) =>
                                                preset.id === pStoreSource
                                        ) || STORE_LOCATION_PRESETS[2];
                                    const productStock =
                                        product.stock !== undefined
                                            ? product.stock
                                            : 50;

                                    /* const isItemInStock =
                                        product.inStock !== undefined
                                            ? product.inStock
                                            : true;*/
                                    const itemSku =
                                        product.sku ||
                                        `${product.name.toUpperCase().replace(/\s+/g, '_')}_${product.storeSlug.toUpperCase()}`;
                                    const itemBasePrice =
                                        product.basePrice ||
                                        Math.round(product.localPrice * 0.8);
                                    const fallbackImage =
                                        product.image ||
                                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
                                    return (
                                        <tr
                                            key={product.id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            {/* Product details */}
                                            <td className="p-4 md:px-6">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        alt={product.name}
                                                        src={fallbackImage}
                                                        className="h-11 w-11 rounded-lg border bg-slate-100 object-cover"
                                                    />
                                                    <div>
                                                        <span className="block text-sm font-extrabold text-slate-800">
                                                            {product.name
                                                                .split('')[0]
                                                                .toUpperCase() +
                                                                product.name.slice(
                                                                    1
                                                                )}
                                                        </span>
                                                        <span className="text-outline block text-[11px]">
                                                            {
                                                                product.quantityText
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SKU */}
                                            <td className="p-4">
                                                <span className="block w-fit rounded border border-slate-200/50 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                                                    {itemSku}
                                                </span>
                                            </td>

                                            {/* Category */}
                                            <td className="p-4">
                                                <span className="text-primary rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <div className="max-w-[220px] space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <img
                                                            src={
                                                                storePreset.logo
                                                            }
                                                            alt={
                                                                storePreset.name
                                                            }
                                                            className="h-4 w-4 shrink-0 rounded-full border border-stone-200 object-cover"
                                                        />
                                                        <span
                                                            className={`py-0.2 rounded border px-1.5 text-[10px] font-bold ${storePreset.colorBg}`}
                                                        >
                                                            {product.storeSlug ||
                                                                storePreset.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Local Market Price edit input */}
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="text-outline text-xs font-bold">
                                                        KSh
                                                    </span>
                                                    <span className="p-4 text-center text-xs font-semibold text-slate-600">
                                                        KSh {product.localPrice}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Base price (wholesale) */}
                                            <td className="p-4 text-center text-xs font-semibold text-slate-600">
                                                KSh {itemBasePrice}
                                            </td>

                                            {/* Stock Quantity */}
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span
                                                        className={`text-xs font-bold ${
                                                            !isItemInStock ||
                                                            productStock === 0
                                                                ? 'text-red-500 line-through'
                                                                : productStock <=
                                                                    10
                                                                  ? 'font-extrabold text-amber-600'
                                                                  : 'text-slate-800'
                                                        }`}
                                                    >
                                                        {productStock} units
                                                    </span>
                                                    {productStock <= 10 &&
                                                        productStock > 0 &&
                                                        isItemInStock && (
                                                            <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-extrabold text-amber-500 uppercase">
                                                                <AlertTriangle
                                                                    size={8}
                                                                />{' '}
                                                                Low Stock
                                                            </span>
                                                        )}
                                                </div>
                                            </td>

                                            {/* Instock Flag Toggle */}
                                            <td className="p-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleStockStatus(
                                                            product
                                                        )
                                                    }
                                                    disabled={statusPending}
                                                    className={`mx-auto flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black tracking-wider uppercase transition-colors ${
                                                        isItemInStock &&
                                                        productStock > 0
                                                            ? 'border-emerald-300 bg-emerald-50 text-[#006e1c] hover:bg-emerald-100'
                                                            : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    {isItemInStock &&
                                                    productStock > 0 ? (
                                                        <>
                                                            <CheckCircle
                                                                size={10}
                                                            />
                                                            <span>
                                                                IN STOCK
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle
                                                                size={10}
                                                            />
                                                            <span>
                                                                OUT OF STOCK
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-right whitespace-nowrap md:pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {hasRowChanges(product) && (
                                                        <button
                                                            disabled={
                                                                updatePending
                                                            }
                                                            onClick={() =>
                                                                handleProductsUpdate(
                                                                    product
                                                                )
                                                            }
                                                            className="cursor-pointer rounded-lg border border-transparent bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100"
                                                            title="Save changes"
                                                        >
                                                            {updatePending
                                                                ? 'Saving...'
                                                                : 'Save'}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            openEdit(product)
                                                        }
                                                        className="cursor-pointer rounded-lg border border-transparent p-1.5 text-[#006e1c] transition-colors hover:border-slate-200 hover:bg-slate-100"
                                                        title="Edit details"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            deleteProduct(
                                                                product.name,
                                                                product.id
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-lg border border-transparent p-1.5 text-rose-600 transition-colors hover:border-rose-100 hover:bg-rose-50"
                                                        title="Delete item"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    {/* Traditional Page Selector Controls Bar */}
                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 p-4 text-xs text-slate-500 sm:flex-row">
                        {/* Left side: Rows per page dropdown selector */}
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Rows per page:</span>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1); // Crucial: Always drop back to page 1 when changing items limit bounds
                                }}
                                className="focus:border-primary rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-700 shadow-sm transition-all outline-none"
                            >
                                <option value={5}>5 items</option>
                                <option value={10}>10 items</option>
                                <option value={25}>25 items</option>
                            </select>
                        </div>

                        {/* Right side: Sequential Step Button controls */}
                        <div className="flex items-center gap-1.5 font-black">
                            <button
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                «
                            </button>

                            <button
                                onClick={() =>
                                    setPage((prev) => Math.max(prev - 1, 1))
                                }
                                disabled={page === 1}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Prev
                            </button>

                            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-800 shadow-inner">
                                Page {page} of {totalPages}
                            </span>

                            <button
                                onClick={() =>
                                    setPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={page === totalPages}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>

                            <button
                                onClick={() => setPage(totalPages)}
                                disabled={page === totalPages}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                »
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: Edit Product Dialog */}
            {editingProduct && (
                <EditProductsModal
                    editingProduct={editingProduct}
                    setEditingProduct={setEditingProduct}
                />
            )}

            {/* MODAL: Add Product Dialog */}
            {isAddOpen && <AddProductsModal setIsAddOpen={setIsAddOpen} />}
        </div>
    );
}
