import {
    AlertTriangle,
    CheckCircle,
    Edit3,
    HelpCircle,
    Package,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { type ChangeEvent, useMemo, useState } from 'react';

import { hubSlug } from '../../../shared/constants';
import type { Product } from '../../../shared/sharedTypes';
import {
    AddProductsModal,
    EditProductsModal,
} from '../Components/Pages/AdminComponents';
import { adminAPI } from '../Library/api';
import { useAdminStore } from '../Store/adminStore';
import useErrorStore from '../Store/errorStore';
import { useStore } from '../Store/productStore';
import useSuccessStore from '../Store/successStore';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('Admin.tsx');
export default function Admin() {
    const { products } = useStore();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const setError = useErrorStore((state) => state.setError);
    const setSuccess = useSuccessStore((state) => state.setSuccess);
    const setProductData = useAdminStore((state) => state.setProductData);
    // Track inline row edits: productId -> partial updates
    const [rowChanges, setRowChanges] = useState<
        Record<string, Partial<Product>>
    >({});
    const hasRowChanges = (product: Product) => {
        const changes = rowChanges[product.id];
        if (!changes) return false;
        const changesObj = changes as Partial<Product>;
        for (const key of Object.keys(changesObj) as Array<keyof Product>) {
            if (changesObj[key] !== product[key]) return true;
        }
        return false;
    };

    const handleRowChange = (
        productId: string,
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, type, value } = event.target;
        let newValue: string | number | boolean = value;
        if (type === 'checkbox')
            newValue = (event.target as HTMLInputElement).checked;
        else if (type === 'number') newValue = Number(value);

        setRowChanges((prev) => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                [name]: newValue,
            },
        }));
    };

    // Open Edit Form
    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setProductData({
            name: product.name,
            localPrice: product.localPrice,
            quantityText: product.quantityText,
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
            sourcingType: 'OPEN_MARKET',
            localPrice: 150,
            quantityText: '1kg, Farm Fresh',
            category: 'Vegetables',
            basePrice: 120,
            stock: 50,
            inStock: true,
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
            isOrganic: true,
            isSeasonal: false,
        });
    };

    // API handler simulations with proper try-catch, console output, and visual feedback
    const handleToggleStockStatus = async (product: Product) => {
        setIsLoading(true);

        try {
            await adminAPI.post('/admin/products/toggle-status', {
                productId: product.id,
                newStatus: !product.inStock,
            });
            log.info(
                `[FreshDrop Admin API Success] Toggled stock status for product ID ${product.id} to ${!product.inStock}`
            );
            setSuccess(
                `Stock status for "${product.name}" updated to ${!product.inStock ? 'OUT OF STOCK' : 'IN STOCK'}.`
            );
            //updateProduct(product.id, { inStock: !product.inStock });
        } catch (error) {
            log.error(
                `[FreshDrop Admin API Error] Failed to toggle stock status for product ID ${product.id}:`,
                { data: error }
            );
            handleApiError(error, setError);
        } finally {
            setIsLoading(false);
        }
    };
    const handleProductsUpdate = async (product: Product) => {
        /*const {
            sku,
            name,
            basePrice,
            sourcingType,
            quantityText,
            localPrice,
            category,
            image,
            isOrganic,
            isSeasonal,
        } = product;*/
        const updates = rowChanges[product.id];
        if (!updates) return;
        log.debug('The product data', { data: { product } });
        log.debug('The updates made ', { data: updates });
        log.debug(`${typeof updates}: ${updates?.localPrice}`);
        setIsLoading(true);
        try {
            await adminAPI.post('/admin/products/sync', {
                productData: product,
                hubSlug,
            });
            setSuccess('Saved updates');
            setRowChanges((prev) => {
                const copy = {
                    ...prev,
                };
                delete copy[product.id];
                return copy;
            });
        } catch (error) {
            handleApiError(error, setError);
            log.error('Update products error', { data: error });
        } finally {
            setIsLoading(false);
        }
    };

    /*const handleDeleteProductAPI = async (productId: string) => {
        if (
            !confirm(
                'Are you sure you want to delete this product from the FreshDrop inventory catalog?'
            )
        ) {
            return;
        }

        setIsLoading(true);
        log.info(
            `[FreshDrop Admin] Calling API route: DELETE /api/products/${productId} ...`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            deleteProduct(productId);
            log.info(
                `[FreshDrop Admin API Success] Successfully removed product ID ${productId}`
            );
        } catch (error) {
            log.error(
                `[FreshDrop Admin API Error] Failed to delete product ID ${productId}:`,
                { data: error }
            );
        } finally {
            setIsLoading(false);
        }
    };*/

    /*const handleResetCatalogAPI = async () => {
        if (
            !confirm(
                'Caution: This will restore the factory-default food items and clear any custom edits or new entries. Proceed?'
            )
        ) {
            return;
        }

        setIsLoading(true);
        log.info(
            `[FreshDrop Admin] Calling API route: POST /api/products/reset-catalog ...`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            resetProducts();
            log.info(
                `[FreshDrop Admin API Success] Catalog refreshed back to initial farm products.`
            );
        } catch (error) {
            log.error(`[FreshDrop Admin API Error] Failed to reset catalog:`, {
                data: error,
            });
        } finally {
            setIsLoading(false);
        }
    };*/

    // Filter products based on search term & category selection
    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
            const matchSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.sku &&
                    product.sku
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()));
            const matchCategory =
                selectedCategory === 'All' ||
                product.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    // Aggregate catalog statistics
    const stats = useMemo(() => {
        const totalCount = products.length;
        let outOfStock = 0;
        let totalStockQty = 0;
        let inventoryValue = 0;
        let lowStockAlerts = 0;

        products.forEach((product: Product) => {
            const st = product.stock !== undefined ? product.stock : 50;
            const isInstk =
                product.inStock !== undefined ? product.inStock : true;

            totalStockQty += st;
            inventoryValue += product.localPrice * st;

            if (!isInstk || st === 0) {
                outOfStock++;
            } else if (st <= 10) {
                lowStockAlerts++;
            }
        });

        return {
            totalCount,
            outOfStock,
            totalStockQty,
            inventoryValue,
            lowStockAlerts,
        };
    }, [products]);

    return (
        <div className="animate-fade-in space-y-6 pb-12" id="admin-panel-page">
            {/* Admin Title Block */}
            <div className="border-outline-variant/10 flex flex-col items-start justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
                <div>
                    <span className="text-primary mb-1 block text-[10px] font-black tracking-widest uppercase">
                        JUJA METROPOLITAN MARKETPLACE
                    </span>
                    <h1 className="font-caveat text-on-surface flex items-center gap-2 text-[38px] leading-tight font-black">
                        <span className="material-symbols-outlined text-primary text-4xl">
                            admin_panel_settings
                        </span>
                        App Store Inventory Admin
                    </h1>
                    <p className="text-outline text-sm font-medium">
                        Manage local farm produce, real-time prices, SKU
                        generators, and live inventory status toggles.
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
                            {stats.totalCount}
                        </span>
                    </div>
                </div>

                <div className="border-outline-variant/20 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <span className="text-outline block text-xs font-bold tracking-wider uppercase">
                            Estimated Stock Value
                        </span>
                        <span className="text-2xl font-black text-slate-800">
                            KSh {stats.inventoryValue.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="border-outline-variant/20 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
                    <div
                        className={`rounded-xl p-3 ${stats.lowStockAlerts > 0 ? 'animate-pulse bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}
                    >
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <span className="text-outline block text-xs font-bold tracking-wider uppercase">
                            Low Stock Alerts
                        </span>
                        <span className="text-2xl font-black text-slate-800">
                            {stats.lowStockAlerts}{' '}
                            <span className="text-outline text-xs font-medium">
                                (&le;10 units)
                            </span>
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
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                            onClick={() => setSelectedCategory(cat)}
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
                                <th className="p-4 text-center">
                                    In-Market Price
                                </th>
                                <th className="p-4 text-center">Base Price</th>
                                <th className="p-4 text-center">Stock Level</th>
                                <th className="p-4 text-center">Status Flag</th>
                                <th className="p-4 text-right md:pr-6">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-outline-variant/10 divide-y text-sm">
                            {filteredProducts.length === 0 ? (
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
                                filteredProducts.map((product) => {
                                    const productStock =
                                        product.stock !== undefined
                                            ? product.stock
                                            : 50;
                                    const isItemInStock =
                                        product.inStock !== undefined
                                            ? product.inStock
                                            : true;
                                    const itemSku =
                                        product.sku ||
                                        `JUJA_MKT_${product.name.toUpperCase().replace(/\s+/g, '_')}_${product.category.toUpperCase()}`;
                                    const itemBasePrice =
                                        product.basePrice ||
                                        Math.round(product.localPrice * 0.8);

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
                                                        src={product.image}
                                                        className="h-11 w-11 rounded-lg border bg-slate-100 object-cover"
                                                    />
                                                    <div>
                                                        <span className="block text-sm font-extrabold text-slate-800">
                                                            {product.name}
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

                                            {/* Local Market Price edit input */}
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="text-outline text-xs font-bold">
                                                        KSh
                                                    </span>
                                                    <input
                                                        type="number"
                                                        name="localPrice"
                                                        value={
                                                            rowChanges[
                                                                product.id
                                                            ]?.localPrice ??
                                                            product.localPrice ??
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            handleRowChange(
                                                                product.id,
                                                                e
                                                            )
                                                        }
                                                        className="border-outline-variant/30 focus:ring-primary w-20 rounded border bg-slate-50 py-1 text-center text-xs font-bold outline-none focus:bg-white focus:ring-1"
                                                    />
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
                                                    disabled={isLoading}
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
                                                            onClick={() =>
                                                                handleProductsUpdate(
                                                                    product
                                                                )
                                                            }
                                                            className="cursor-pointer rounded-lg border border-transparent bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100"
                                                            title="Save changes"
                                                        >
                                                            Save
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
                                                        /*onClick={() =>
                                                            handleDeleteProductAPI(
                                                                product.id
                                                            )
                                                        }*/
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
                </div>
            </div>

            {/* MODAL: Edit Product Dialog */}
            {editingProduct && (
                <EditProductsModal setEditingProduct={setEditingProduct} />
            )}

            {/* MODAL: Add Product Dialog */}
            {isAddOpen && <AddProductsModal setIsAddOpen={setIsAddOpen} />}
        </div>
    );
}
