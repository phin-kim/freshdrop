import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

import { hubSlug } from '../../../../../shared/constants';
import type { Product } from '../../../../../shared/sharedTypes';
import { generateProductSku } from '../../../Helpers/functions';
import { useUpdateInventory } from '../../../Hooks/adminSynchronization';
import { useAdminStore } from '../../../Store/adminStore';

export function EditProductsModal({
    setEditingProduct,
    //hubSlug,
}: {
    //hubSlug: string;
    setEditingProduct: React.Dispatch<React.SetStateAction<Product | null>>;
}) {
    const handleProductDataChange = useAdminStore(
        (state) => state.handleProductDataChange
    );
    const { mutate: updateInventory, isPending: updatePending } =
        useUpdateInventory();
    const productData = useAdminStore((state) => state.productData);
    //const syncProduct = useAdminStore((state) => state.syncProduct);

    //const setEditingProduct = useAdminStore((state) => state.setEditingProduct);
    //const isLoading = useAdminStore((state) => state.isLoading);
    const computedSku = useMemo(
        () => generateProductSku(productData.name, productData.category),
        [productData.name, productData.category]
    );
    const handleSubmit = async (
        event: React.ChangeEvent<HTMLFormElement>
    ): Promise<void> => {
        // 🟢 This stops the browser from doing a hard page refresh!
        event.preventDefault();

        //await syncProduct(computedSku);
        updateInventory(
            {
                productData,
                sku: computedSku,
                hubSlug,
            },
            {
                onSuccess: () => {
                    setEditingProduct(null);
                },
            }
        );
    };
    return (
        <>
            <div className="animate-fade-in fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                    <div className="flex items-center justify-between bg-[#006e1c] p-5 text-white">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-2xl">
                                edit_note
                            </span>
                            <div>
                                <h3 className="text-base leading-none font-bold">
                                    Modify Farm Item
                                </h3>
                                <span className="mt-1 block text-[10px] font-bold tracking-widest text-emerald-100 uppercase">
                                    Live catalog adjustments
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditingProduct(null)}
                            className="cursor-pointer text-white transition-colors hover:text-slate-100 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-2xl">
                                close
                            </span>
                        </button>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="max-h-[80vh] space-y-4 overflow-y-auto p-6"
                    >
                        {/* Name */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                Product Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={productData.name}
                                onChange={handleProductDataChange}
                                className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                            />
                        </div>

                        {/* Grid block */}
                        <div className="grid grid-cols-2 gap-3.5">
                            {/* Category */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Category
                                </label>
                                <select
                                    value={productData.category}
                                    name="category"
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none"
                                >
                                    <option value="Fruits">Fruits</option>
                                    <option value="Vegetables">
                                        Vegetables
                                    </option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Bakery">Bakery</option>
                                    <option value="Household">Household</option>
                                </select>
                            </div>

                            {/* SKU Code (Auto preview) */}
                            <div className="space-y-1">
                                <label className="flex items-center gap-1 text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    SKU Code
                                    <span
                                        className="material-symbols-outlined text-primary text-xs"
                                        title="Automatically determined by capitalized item name & category with JUJA_MKT_ prefix"
                                    >
                                        info
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={computedSku}
                                    className="w-full rounded-xl border bg-slate-100 px-3 py-2 font-mono text-xs text-slate-500 outline-none select-all"
                                />
                            </div>
                        </div>

                        {/* Pricing Grid */}
                        <div className="grid grid-cols-2 gap-3.5">
                            {/* Local Price */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Local price (KSh)
                                </label>
                                <input
                                    type="number"
                                    name="localPrice"
                                    min={1}
                                    required
                                    value={productData.localPrice}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Base Price (KSh)
                                </label>
                                <input
                                    type="number"
                                    name="basePrice"
                                    min={1}
                                    required
                                    value={productData.basePrice}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* Quantity Text & Image */}
                        <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Quantity text description
                                </label>
                                <input
                                    type="text"
                                    name="quantityText"
                                    required
                                    placeholder="e.g. 1kg, Greenhouse"
                                    value={productData.quantityText}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Stock quantity units
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    min={0}
                                    required
                                    value={productData.stock}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* Image URL input */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                Product Image URL
                            </label>
                            <input
                                type="url"
                                name="image"
                                placeholder="Paste high-res image link..."
                                value={productData.image}
                                onChange={handleProductDataChange}
                                className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white"
                            />
                        </div>

                        {/* Quick Checklist flags */}
                        <div className="flex flex-wrap gap-4 rounded-xl border bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="checkbox"
                                    name="isOrganic"
                                    checked={productData.isOrganic}
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                />
                                <span>Certified Organic Produce</span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="checkbox"
                                    name="isSeasonal"
                                    checked={productData.isSeasonal}
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                />
                                <span>Seasonal Specials Item</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="radio"
                                    name="sourcingType" // Group name matches your state key
                                    value="OPEN_MARKET" // Value sent when selected
                                    checked={
                                        productData.sourcingType ===
                                        'OPEN_MARKET'
                                    }
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 accent-[#006e1c]"
                                />
                                <span>Open Market</span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="radio"
                                    name="sourcingType"
                                    value="SUPERMARKET"
                                    checked={
                                        productData.sourcingType ===
                                        'SUPERMARKET'
                                    }
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 accent-[#006e1c]"
                                />
                                <span>Supermarket</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800 transition-all hover:bg-slate-200"
                            >
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                disabled={updatePending}
                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006e1c] py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#005313]"
                            >
                                {updatePending && (
                                    <RefreshCw
                                        size={12}
                                        className="animate-spin"
                                    />
                                )}
                                <span>Save Inventory Edits</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
export function AddProductsModal({
    setIsAddOpen,
    //hubSlug,
}: {
    //hubSlug: string;
    setIsAddOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    //const syncProduct = useAdminStore((state) => state.syncProduct);
    //const isLoading = useAdminStore((state) => state.isLoading);
    const productData = useAdminStore((state) => state.productData);
    const { mutate: updateInventory, isPending: addPending } =
        useUpdateInventory();
    const handleProductDataChange = useAdminStore(
        (state) => state.handleProductDataChange
    );
    const computedSku = useMemo(
        () => generateProductSku(productData.name, productData.category),
        [productData.name, productData.category]
    );
    const handleSubmit = async (
        event: React.ChangeEvent<HTMLFormElement>
    ): Promise<void> => {
        // 🟢 This stops the browser from doing a hard page refresh!
        event.preventDefault();

        updateInventory(
            {
                productData,
                sku: computedSku,
                hubSlug,
            },
            {
                onSuccess: () => {
                    setIsAddOpen(false);
                },
            }
        );
    };

    return (
        <>
            <div className="animate-fade-in fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                    <div className="flex items-center justify-between bg-[#006e1c] p-5 text-white">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-2xl">
                                add_shopping_cart
                            </span>
                            <div>
                                <h3 className="text-base leading-none font-bold">
                                    Catalog New Product
                                </h3>
                                <span className="mt-1 block text-[10px] font-bold tracking-widest text-emerald-100 uppercase">
                                    Add to metropolitan database
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAddOpen(false)}
                            className="cursor-pointer text-white transition-colors hover:text-slate-100 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-2xl">
                                close
                            </span>
                        </button>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="max-h-[80vh] space-y-4 overflow-y-auto p-6"
                    >
                        {/* Name */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                Product Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="e.g. Red Grapes, Sweet Bananas"
                                value={productData.name}
                                onChange={handleProductDataChange}
                                className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                            />
                        </div>

                        {/* Grid block */}
                        <div className="grid grid-cols-2 gap-3.5">
                            {/* Category */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Category
                                </label>
                                <select
                                    value={productData.category}
                                    name="category"
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none"
                                >
                                    <option value="Fruits">Fruits</option>
                                    <option value="Vegetables">
                                        Vegetables
                                    </option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Bakery">Bakery</option>
                                    <option value="Household">Household</option>
                                </select>
                            </div>

                            {/* SKU Code (Auto preview) */}
                            <div className="space-y-1">
                                <label className="flex items-center gap-1 text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    SKU Code
                                    <span
                                        className="material-symbols-outlined text-primary text-xs"
                                        title="Automatically determined by capitalized item name & category with JUJA_MKT_ prefix"
                                    >
                                        info
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={computedSku}
                                    className="w-full rounded-xl border bg-slate-100 px-3 py-2 font-mono text-xs text-slate-500 outline-none select-all"
                                    placeholder="Auto-generated SKU"
                                />
                            </div>
                        </div>

                        {/* Pricing Grid */}
                        <div className="grid grid-cols-2 gap-3.5">
                            {/* Local Price */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Local price (KSh)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    name="localPrice"
                                    required
                                    value={productData.localPrice}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Base Price (KSh)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    name="basePrice"
                                    required
                                    value={productData.basePrice}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* Quantity Text & Image */}
                        <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Quantity text description
                                </label>
                                <input
                                    type="text"
                                    name="quantityText"
                                    required
                                    placeholder="e.g. 500g, Pack"
                                    value={productData.quantityText}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Stock quantity units
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    required
                                    value={productData.stock}
                                    onChange={handleProductDataChange}
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* Image URL input */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                Product Image URL
                            </label>
                            <input
                                type="url"
                                name="image"
                                placeholder="Paste high-res image link..."
                                value={productData.image}
                                onChange={handleProductDataChange}
                                className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white"
                            />
                        </div>

                        {/* Quick Checklist flags */}
                        <div className="flex flex-wrap gap-4 rounded-xl border bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="checkbox"
                                    name="isOrganic"
                                    checked={productData.isOrganic}
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                />
                                <span>Certified Organic Produce</span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="checkbox"
                                    name="isSeasonal"
                                    checked={productData.isSeasonal}
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                />
                                <span>Seasonal Specials Item</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="radio"
                                    name="sourcingType" // Group name matches your state key
                                    value="OPEN_MARKET" // Value sent when selected
                                    checked={
                                        productData.sourcingType ===
                                        'OPEN_MARKET'
                                    }
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 accent-[#006e1c]"
                                />
                                <span>Open Market</span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 select-none">
                                <input
                                    type="radio"
                                    name="sourcingType"
                                    value="SUPERMARKET"
                                    checked={
                                        productData.sourcingType ===
                                        'SUPERMARKET'
                                    }
                                    onChange={handleProductDataChange}
                                    className="h-4.5 w-4.5 accent-[#006e1c]"
                                />
                                <span>Supermarket</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800 transition-all hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={addPending}
                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006e1c] py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#005313]"
                            >
                                {addPending && (
                                    <RefreshCw
                                        size={12}
                                        className="animate-spin"
                                    />
                                )}
                                <span>Create Item Record</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
