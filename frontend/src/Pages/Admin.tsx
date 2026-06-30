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
import { type FormEvent, useMemo, useState } from 'react';

import { populateProductDefaults, useStore } from '../store';
import { Product } from '../types';

export default function Admin() {
    const {
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProducts,
        addToast,
    } = useStore();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isApiLoading, setIsApiLoading] = useState<string | null>(null);

    // New/Edit product form states
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState(0);
    const [formBasePrice, setFormBasePrice] = useState(0);
    const [formQuantityText, setFormQuantityText] = useState('1 unit');
    const [formCategory, setFormCategory] = useState<
        'Fruits' | 'Vegetables' | 'Dairy' | 'Bakery' | 'Household'
    >('Fruits');
    const [formStock, setFormStock] = useState(50); // the number of items currently present
    const [formInStock, setFormInStock] = useState(true);
    const [formImage, setFormImage] = useState(
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'
    );
    const [formIsOrganic, setFormIsOrganic] = useState(true);
    const [formIsSeasonal, setFormIsSeasonal] = useState(false);

    // Auto-calculated SKU helper as the admin types
    const computedSku = useMemo(() => {
        const cleanName = formName
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .replace(/_+/g, '_');
        const cleanCategory = formCategory.toUpperCase();
        return cleanName ? `JUJA_MKT_${cleanName}_${cleanCategory}` : '';
    }, [formName, formCategory]);

    // Open Edit Form
    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setFormName(product.name);
        setFormPrice(product.price);
        setFormBasePrice(product.basePrice || Math.round(product.price * 0.8));
        setFormQuantityText(product.quantityText);
        setFormCategory(product.category);
        setFormStock(product.stock !== undefined ? product.stock : 50);
        setFormInStock(product.inStock !== undefined ? product.inStock : true);
        setFormImage(product.image);
        setFormIsOrganic(!!product.isOrganic);
        setFormIsSeasonal(!!product.isSeasonal);
    };

    // Open Add Form
    const openAdd = () => {
        setIsAddOpen(true);
        setFormName('');
        setFormPrice(150);
        setFormBasePrice(120);
        setFormQuantityText('1kg, Farm Fresh');
        setFormCategory('Fruits');
        setFormStock(50);
        setFormInStock(true);
        setFormImage(
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'
        );
        setFormIsOrganic(true);
        setFormIsSeasonal(false);
    };

    // API handler simulations with proper try-catch, console output, and visual feedback
    const handleToggleStockStatus = async (product: Product) => {
        const currentStatus =
            product.inStock !== undefined ? product.inStock : true;
        const newStatus = !currentStatus;
        const newStockVal = newStatus
            ? product.stock && product.stock > 0
                ? product.stock
                : 10
            : 0;

        setIsApiLoading(`toggle-${product.id}`);
        console.log(
            `[FreshDrop Admin] Calling API route: PUT /api/products/${product.id}/stock ...`
        );

        try {
            // Simulate 400ms network roundtrip delay
            await new Promise((resolve) => setTimeout(resolve, 400));

            updateProduct(product.id, {
                inStock: newStatus,
                stock: newStockVal,
            });

            console.log(
                `[FreshDrop Admin API Success] Updated stock status for product ID ${product.id}. inStock: ${newStatus}, stock: ${newStockVal}`
            );
        } catch (error) {
            console.error(
                `[FreshDrop Admin API Error] Failed to toggle stock status for product ID ${product.id}:`,
                error
            );
        } finally {
            setIsApiLoading(null);
        }
    };

    const handleUpdatePriceAPI = async (
        productId: string,
        newPrice: number
    ) => {
        setIsApiLoading(`price-${productId}`);
        console.log(
            `[FreshDrop Admin] Calling API route: PATCH /api/products/${productId}/price ...`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, 300));

            updateProduct(productId, { price: Number(newPrice) });

            console.log(
                `[FreshDrop Admin API Success] Updated local price for product ID ${productId} to KSh ${newPrice}`
            );
        } catch (error) {
            console.error(
                `[FreshDrop Admin API Error] Failed to update price for product ID ${productId}:`,
                error
            );
        } finally {
            setIsApiLoading(null);
        }
    };

    const handleCreateProductAPI = async (e: FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            addToast('Please provide a valid product name', 'error');
            return;
        }

        setIsApiLoading('create');
        console.log(
            `[FreshDrop Admin] Calling API route: POST /api/products ...`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, 800));

            const productPayload: Omit<Product, 'id'> = {
                name: formName.trim(),
                category: formCategory,
                price: Number(formPrice),
                basePrice: Number(formBasePrice),
                quantityText: formQuantityText.trim(),
                image:
                    formImage.trim() ||
                    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
                stock: Number(formStock),
                inStock: formInStock,
                sku: computedSku,
                isOrganic: formIsOrganic,
                isSeasonal: formIsSeasonal,
                rating: 5.0,
            };

            addProduct(productPayload);
            setIsAddOpen(false);
            console.log(
                `[FreshDrop Admin API Success] Created new product with SKU: ${computedSku}`,
                productPayload
            );
        } catch (error) {
            console.error(
                `[FreshDrop Admin API Error] Failed to create product:`,
                error
            );
        } finally {
            setIsApiLoading(null);
        }
    };

    const handleUpdateProductAPI = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        setIsApiLoading('edit');
        console.log(
            `[FreshDrop Admin] Calling API route: PUT /api/products/${editingProduct.id} ...`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, 700));

            const updatePayload: Partial<Product> = {
                name: formName.trim(),
                category: formCategory,
                price: Number(formPrice),
                basePrice: Number(formBasePrice),
                quantityText: formQuantityText.trim(),
                image: formImage.trim(),
                stock: Number(formStock),
                inStock: formInStock,
                sku: computedSku,
                isOrganic: formIsOrganic,
                isSeasonal: formIsSeasonal,
            };

            updateProduct(editingProduct.id, updatePayload);
            setEditingProduct(null);
            console.log(
                `[FreshDrop Admin API Success] Modified product ${editingProduct.id}:`,
                updatePayload
            );
        } catch (error) {
            console.error(
                `[FreshDrop Admin API Error] Failed to modify product ${editingProduct.id}:`,
                error
            );
        } finally {
            setIsApiLoading(null);
        }
    };

    const handleDeleteProductAPI = async (productId: string) => {
        if (
            !confirm(
                'Are you sure you want to delete this product from the FreshDrop inventory catalog?'
            )
        ) {
            return;
        }

        setIsApiLoading(`delete-${productId}`);
        console.log(
            `[FreshDrop Admin] Calling API route: DELETE /api/products/${productId} ...`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            deleteProduct(productId);
            console.log(
                `[FreshDrop Admin API Success] Successfully removed product ID ${productId}`
            );
        } catch (error) {
            console.error(
                `[FreshDrop Admin API Error] Failed to delete product ID ${productId}:`,
                error
            );
        } finally {
            setIsApiLoading(null);
        }
    };

    const handleResetCatalogAPI = async () => {
        if (
            !confirm(
                'Caution: This will restore the factory-default food items and clear any custom edits or new entries. Proceed?'
            )
        ) {
            return;
        }

        setIsApiLoading('reset');
        console.log(
            `[FreshDrop Admin] Calling API route: POST /api/products/reset-catalog ...`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            resetProducts();
            console.log(
                `[FreshDrop Admin API Success] Catalog refreshed back to initial farm products.`
            );
        } catch (error) {
            console.error(
                `[FreshDrop Admin API Error] Failed to reset catalog:`,
                error
            );
        } finally {
            setIsApiLoading(null);
        }
    };

    // Filter products based on search term & category selection
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchSearch =
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.sku &&
                    p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchCategory =
                selectedCategory === 'All' || p.category === selectedCategory;
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

        products.forEach((p) => {
            const st = p.stock !== undefined ? p.stock : 50;
            const isInstk = p.inStock !== undefined ? p.inStock : true;

            totalStockQty += st;
            inventoryValue += p.price * st;

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
                        onClick={handleResetCatalogAPI}
                        disabled={isApiLoading !== null}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-red-300 px-4 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={
                                isApiLoading === 'reset' ? 'animate-spin' : ''
                            }
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
                                <th className="p-4 text-center">
                                    Wholesale Base
                                </th>
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
                                        Math.round(product.price * 0.8);

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
                                                        value={product.price}
                                                        onChange={(e) =>
                                                            handleUpdatePriceAPI(
                                                                product.id,
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
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
                                                    disabled={
                                                        isApiLoading ===
                                                        `toggle-${product.id}`
                                                    }
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
                                                            handleDeleteProductAPI(
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
                </div>
            </div>

            {/* MODAL: Edit Product Dialog */}
            {editingProduct && (
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
                            onSubmit={handleUpdateProductAPI}
                            className="max-h-[80vh] space-y-4 overflow-y-auto p-6"
                        >
                            {/* Name */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) =>
                                        setFormName(e.target.value)
                                    }
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
                                        value={formCategory}
                                        onChange={(e) =>
                                            setFormCategory(
                                                e.target.value as any
                                            )
                                        }
                                        className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none"
                                    >
                                        <option value="Fruits">Fruits</option>
                                        <option value="Vegetables">
                                            Vegetables
                                        </option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Bakery">Bakery</option>
                                        <option value="Household">
                                            Household
                                        </option>
                                    </select>
                                </div>

                                {/* SKU Code (Auto preview) */}
                                <div className="space-y-1">
                                    <label className="block flex items-center gap-1 text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
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
                                        min={1}
                                        required
                                        value={formPrice}
                                        onChange={(e) =>
                                            setFormPrice(Number(e.target.value))
                                        }
                                        className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                    />
                                </div>

                                {/* Wholesale Base Price */}
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                        Wholesale Base Price (KSh)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={formBasePrice}
                                        onChange={(e) =>
                                            setFormBasePrice(
                                                Number(e.target.value)
                                            )
                                        }
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
                                        required
                                        placeholder="e.g. 1kg, Greenhouse"
                                        value={formQuantityText}
                                        onChange={(e) =>
                                            setFormQuantityText(e.target.value)
                                        }
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
                                        value={formStock}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setFormStock(val);
                                            if (val <= 0) {
                                                setFormInStock(false);
                                            }
                                        }}
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
                                    placeholder="Paste high-res image link..."
                                    value={formImage}
                                    onChange={(e) =>
                                        setFormImage(e.target.value)
                                    }
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white"
                                />
                            </div>

                            {/* Quick Checklist flags */}
                            <div className="flex flex-wrap gap-4 rounded-xl border bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                                <label className="flex cursor-pointer items-center gap-2 select-none">
                                    <input
                                        type="checkbox"
                                        checked={formInStock}
                                        onChange={(e) => {
                                            setFormInStock(e.target.checked);
                                            if (
                                                e.target.checked &&
                                                formStock === 0
                                            ) {
                                                setFormStock(20); // auto preload some stock
                                            }
                                        }}
                                        className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                    />
                                    <span>Mark as Live In-Stock</span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 select-none">
                                    <input
                                        type="checkbox"
                                        checked={formIsOrganic}
                                        onChange={(e) =>
                                            setFormIsOrganic(e.target.checked)
                                        }
                                        className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                    />
                                    <span>Certified Organic Produce</span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 select-none">
                                    <input
                                        type="checkbox"
                                        checked={formIsSeasonal}
                                        onChange={(e) =>
                                            setFormIsSeasonal(e.target.checked)
                                        }
                                        className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                    />
                                    <span>Seasonal Specials Item</span>
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
                                    disabled={isApiLoading === 'edit'}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006e1c] py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#005313]"
                                >
                                    {isApiLoading === 'edit' && (
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
            )}

            {/* MODAL: Add Product Dialog */}
            {isAddOpen && (
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
                            onSubmit={handleCreateProductAPI}
                            className="max-h-[80vh] space-y-4 overflow-y-auto p-6"
                        >
                            {/* Name */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Red Grapes, Sweet Bananas"
                                    value={formName}
                                    onChange={(e) =>
                                        setFormName(e.target.value)
                                    }
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
                                        value={formCategory}
                                        onChange={(e) =>
                                            setFormCategory(
                                                e.target.value as any
                                            )
                                        }
                                        className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none"
                                    >
                                        <option value="Fruits">Fruits</option>
                                        <option value="Vegetables">
                                            Vegetables
                                        </option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Bakery">Bakery</option>
                                        <option value="Household">
                                            Household
                                        </option>
                                    </select>
                                </div>

                                {/* SKU Code (Auto preview) */}
                                <div className="space-y-1">
                                    <label className="block flex items-center gap-1 text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
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
                                        required
                                        value={formPrice}
                                        onChange={(e) =>
                                            setFormPrice(Number(e.target.value))
                                        }
                                        className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                                    />
                                </div>

                                {/* Wholesale Base Price */}
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                                        Wholesale Base Price (KSh)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={formBasePrice}
                                        onChange={(e) =>
                                            setFormBasePrice(
                                                Number(e.target.value)
                                            )
                                        }
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
                                        required
                                        placeholder="e.g. 500g, Pack"
                                        value={formQuantityText}
                                        onChange={(e) =>
                                            setFormQuantityText(e.target.value)
                                        }
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
                                        value={formStock}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setFormStock(val);
                                            if (val <= 0) {
                                                setFormInStock(false);
                                            }
                                        }}
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
                                    placeholder="Paste high-res image link..."
                                    value={formImage}
                                    onChange={(e) =>
                                        setFormImage(e.target.value)
                                    }
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white"
                                />
                            </div>

                            {/* Quick Checklist flags */}
                            <div className="flex flex-wrap gap-4 rounded-xl border bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                                <label className="flex cursor-pointer items-center gap-2 select-none">
                                    <input
                                        type="checkbox"
                                        checked={formInStock}
                                        onChange={(e) => {
                                            setFormInStock(e.target.checked);
                                            if (
                                                e.target.checked &&
                                                formStock === 0
                                            ) {
                                                setFormStock(20);
                                            }
                                        }}
                                        className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                    />
                                    <span>Mark as Live In-Stock</span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 select-none">
                                    <input
                                        type="checkbox"
                                        checked={formIsOrganic}
                                        onChange={(e) =>
                                            setFormIsOrganic(e.target.checked)
                                        }
                                        className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                    />
                                    <span>Certified Organic Produce</span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 select-none">
                                    <input
                                        type="checkbox"
                                        checked={formIsSeasonal}
                                        onChange={(e) =>
                                            setFormIsSeasonal(e.target.checked)
                                        }
                                        className="h-4.5 w-4.5 rounded accent-[#006e1c]"
                                    />
                                    <span>Seasonal Specials Item</span>
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
                                    disabled={isApiLoading === 'create'}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006e1c] py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#005313]"
                                >
                                    {isApiLoading === 'create' && (
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
            )}
        </div>
    );
}
