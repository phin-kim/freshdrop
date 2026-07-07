import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MdAdd, MdFilterList, MdSearch } from 'react-icons/md';

import { adminAPI } from '../Library/api';
import { useDeliveryStore } from '../Store/delivery';
import useErrorStore from '../Store/errorStore';
import { useStore } from '../Store/productStore';
import type { DBProductResponse } from '../Types/Product';

const fetchStorefrontProducts = async ({ pageParam = null }) => {
    const url = pageParam
        ? `/admin/products?cursor=${pageParam}&limit=8`
        : '/admin/products?limit=8';

    const res = await adminAPI.get(url);
    const mappedProducts = res.data.data.map((dbProduct: DBProductResponse) => {
        // Find the hub configurations profile (e.g., Juja Market Hub setup)
        const localizedHub = dbProduct.hubConfigs?.[0];

        return {
            id: dbProduct.id,
            name: dbProduct.name,
            sku: dbProduct.sku,
            category: dbProduct.category,
            sourcingType: dbProduct.sourcingType,
            quantityText: dbProduct.quantityText || '1kg, Farm Fresh',
            basePrice: Number(dbProduct.basePrice || 0),

            // 🟢 Extract the nested location states and assign them to your flat keys
            localPrice: localizedHub
                ? Number(localizedHub.localPrice)
                : Number(dbProduct.localPrice || 0),
            inStock: localizedHub ? localizedHub.status === 'IN_STOCK' : true,
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
    });
    return {
        data: mappedProducts,
        nextCursor: res.data.nextCursor,
    };
};
export default function TabDiscovery() {
    const setError = useErrorStore((state) => state.setError);
    const addToCart = useStore((state) => state.addToCart);
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
        useInfiniteQuery({
            queryKey: ['products'],
            queryFn: fetchStorefrontProducts,
            initialPageParam: null,
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        });

    // 1. Flatten TanStack's cache directly in the component stream
    // This naturally appends page 2, page 3, etc., automatically as they arrive!
    const serverProducts = data?.pages.flatMap((page) => page.data) || [];

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

    // Filtered products list for Discovery and Search views
    const filteredProducts = useMemo(() => {
        // Read directly from the flattened server array instead of Zustand 'products'
        let list = [...serverProducts];

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
    }, [serverProducts, searchQuery, selectedCategory, sortBy]);
    const availableProducts = filteredProducts.filter((p) => p.inStock);

    if (status === 'pending') {
        return (
            <div className="py-20 text-center font-semibold text-slate-500">
                Loading farm-fresh groceries...
            </div>
        );
    }

    if (status === 'error') {
        setError('Something went wrong. Please refresh the page.');
        return;
    }
    return (
        <div className="space-y-6">
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
            {availableProducts.length === 0 ? (
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
                    {availableProducts.map((p) => (
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
                                {p.isOrganic && (
                                    <span className="absolute top-2 left-2 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
                                        Organic
                                    </span>
                                )}
                                {p.isSeasonal && (
                                    <span className="absolute top-2 right-2 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-900 uppercase">
                                        Seasonal
                                    </span>
                                )}
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
                    ))}
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
