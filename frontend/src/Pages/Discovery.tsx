import { useMemo, useState } from 'react';
import { MdAdd, MdFilterList, MdSearch } from 'react-icons/md';

import { useDeliveryStore } from '../Store/delivery';
import { useStore } from '../Store/productStore';

export default function TabDiscovery() {
    const { products, addToCart } = useStore();

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
        let list = [...products];

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
            list.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'Price: High to Low') {
            list.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'Rating') {
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === 'Organic First') {
            list.sort((a, b) => (b.isOrganic ? 1 : 0) - (a.isOrganic ? 1 : 0));
        }

        return list;
    }, [products, searchQuery, selectedCategory, sortBy]);

    return (
        <div className="space-y-6">
            <section className="border-outline-variant/25 flex flex-col border-b py-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="font-caveat text-primary mb-1 text-[38px] font-bold">
                        Explore Products ({filteredProducts.length})
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
            {filteredProducts.length === 0 ? (
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
                    {filteredProducts.map((p) => (
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
                                        {p.name}
                                    </h3>
                                    <p className="text-outline mb-2 text-xs font-semibold">
                                        {p.quantityText}
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2">
                                    <span className="text-primary text-lg font-black">
                                        {p.price} sh
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
        </div>
    );
}
