import { useMemo, useState } from 'react';
import { useStore } from '../Store/productStore';
import { useDeliveryStore } from '../Store/delivery';

export default function TabDiscovery() {
  const { products, addToCart } = useStore();

  const searchQuery = useDeliveryStore((state)=>state.searchQuery)
  const setSearchQuery = useDeliveryStore((state)=>state.setSearchQuery)
 const [sortBy, setSortBy] = useState("Price: Low to High");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const categoryTabs = ["All Items", "Fruits", "Vegetables", "Dairy", "Bakery", "Household"];

  // Filtered products list for Discovery and Search views
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.quantityText.toLowerCase().includes(q)
      );
    }

    // Filter by Category
    if (selectedCategory !== "All Items") {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Apply Sorting logic
    if (sortBy === "Price: Low to High") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "Rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "Organic First") {
      list.sort((a, b) => (b.isOrganic ? 1 : 0) - (a.isOrganic ? 1 : 0));
    }

    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-outline-variant/25">
        <div>
          <h2 className="font-caveat text-[38px] font-bold text-primary mb-1">Explore Products ({filteredProducts.length})</h2>
          <p className="text-xs text-outline font-semibold uppercase tracking-wider">Filtered by: {selectedCategory} • Sorting: {sortBy}</p>
        </div>
        
        {/* Sorting select container */}
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">filter_list</span>
            <span>Sort By:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-[#becab9]/50 rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Rating</option>
            <option>Organic First</option>
          </select>
        </div>
      </section>

      {/* Categories Chips horizontal scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
        {categoryTabs.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap text-xs font-black uppercase tracking-wider shadow-sm border transition-all ${
              selectedCategory === cat
                ? "bg-primary text-white border-primary"
                : "bg-white text-on-surface hover:bg-emerald-50/40 border-[#becab9]/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Combined Discovery Instant Search Filter */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
        <input
          type="text"
          placeholder="Search fresh produce in current category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-[#becab9]/40 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none focus:border-transparent transition-all shadow-sm text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface focus:outline-none"
          >
            <span className="material-symbols-outlined text-lg">cancel</span>
          </button>
        )}
      </div>

      {/* Core Products Grid (Asymmetric layout) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
          <span className="material-symbols-outlined text-6xl text-amber-500 font-bold">search_off</span>
          <h3 className="font-bold text-lg">No Fresh Products Match Your Search</h3>
          <p className="text-sm text-on-surface-variant">Try refining your filter words, switching the category chip, or resetting filters.</p>
          <button
            onClick={() => { setSelectedCategory("All Items"); setSearchQuery(""); }}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-container"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div key={p.id} className="group bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md border border-outline-variant/20 overflow-hidden hover:-translate-y-0.5 transition-all flex flex-col justify-between">
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {p.isOrganic && (
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Organic
                  </span>
                )}
                {p.isSeasonal && (
                  <span className="absolute top-2 right-2 bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Seasonal
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-[#3e4a41] uppercase tracking-widest">{p.category}</span>
                  <h3 className="font-bold text-[16px] text-on-surface truncate my-1 leading-tight group-hover:text-primary transition-colors">{p.name}</h3>
                  <p className="text-xs text-outline font-semibold mb-2">{p.quantityText}</p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-auto">
                  <span className="font-black text-lg text-primary">{p.price} sh</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="bg-amber-400 hover:bg-amber-500 text-on-background w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 hover:shadow shadow-sm"
                  >
                    <span className="material-symbols-outlined font-black">add</span>
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
