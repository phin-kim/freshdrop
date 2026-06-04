import { FormEvent, ReactNode } from 'react';
import { GiCabbage, GiMilkCarton, GiShinyApple } from 'react-icons/gi';
import {
    MdMoped,
    MdOutlineAddShoppingCart,
    MdOutlineArrowForward,
    MdOutlineBakeryDining,
    MdOutlineFormatQuote,
    MdOutlineLocationOn,
    MdOutlineMap,
    MdOutlineSave,
    MdOutlineSearch,
    MdOutlineShoppingCart,
    MdSmartphone,
} from 'react-icons/md';
import { useNavigate } from 'react-router';

import DeliveryLocationSelector from '../Components/Maps';
import { CurrentLocationButton } from '../Hooks/navigation';
import { useDeliveryStore } from '../Store/delivery';
import { useStore } from '../Store/productStore';

export default function Home() {
    const navigate = useNavigate();
    const { products, addToCart, addToast } = useStore();

    //const searchQuery = useDeliveryStore((state)=>state.searchQuery)
    const deliveryLocation = useDeliveryStore(
        (state) => state.deliveryLocation
    );
    const setDeliveryLocation = useDeliveryStore(
        (state) => state.setDeliveryLocation
    );
    const setSearchQuery = useDeliveryStore((state) => state.setSearchQuery);
    const setSelectedCategory = useDeliveryStore(
        (state) => state.setSelectedCategory
    );
    const selectedCategory = useDeliveryStore(
        (state) => state.selectedCategory
    );
    const deliveryLocationInput = useDeliveryStore(
        (state) => state.deliveryLocationInput
    );
    const setDeliveryLocationInput = useDeliveryStore(
        (state) => state.setDeliveryLocationInput
    );

    const handleCategoryClick = (cat: string) => {
        setSelectedCategory(cat);
        console.log(`This is the category chosen ${cat}`);

        navigate('/discovery');
    };
    console.log(`THis is the current selected  category ${selectedCategory}`);

    const handleLocationSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (deliveryLocationInput.trim()) {
            setDeliveryLocation(deliveryLocationInput);
            addToast(
                `Delivery destination updated to: ${deliveryLocationInput}`,
                'success'
            );
        }
    };

    return (
        <div className="animate-fade-in space-y-12 pb-12">
            {/* Hero Section */}
            <section className="mt-4 mb-4 flex flex-col items-center justify-between gap-8 lg:flex-row">
                {/* Left Side: Copy and Controls */}
                <div className="flex-1 space-y-6 text-center lg:text-left">
                    <h2 className="font-caveat text-primary text-5xl leading-tight font-black tracking-tight md:text-6xl">
                        Fresh Groceries Delivered in Under 2 Hours.
                    </h2>

                    <p className="text-on-surface-variant mx-auto max-w-xl font-sans text-base leading-relaxed font-medium md:text-lg lg:mx-0">
                        Skip the checkout lines. We source directly from
                        certified organic farms, local kiosks, and supermarkets,
                        delivering straight to your table.
                    </p>

                    {/* Delivery form widget combined */}
                    <DeliveryLocationSelector />
                </div>

                {/* Right Side: Spectacular organic crop photo illustration */}
                <div className="max-w-xs flex-1 md:max-w-md lg:max-w-xl">
                    <img
                        alt="Fresh crop harvest illustration"
                        className="pointer-events-none h-auto w-full object-contain drop-shadow-lg"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv5Z2qP1uwzBR51qh2Q3vHpUfhD2rRvgaBTzv3_weIGiMqOVXmX50q3wMeY6_FeAbrH2LRENF-gj2jx8G2NdwEwb45Qf4eqkT1rFp3gL3gPz7Ixj3_YybUthoJVXkOPv_02zwxQTcNrxrq4oVOeb50MYwxvXuph3_8cFXp-qwyY9XujDyowlcFsuOpwVS1ip5C1eVhuiztU81lc2SHkm-ZwW_GrMiSvwIfJWklX3Oo1O308TcAjlpOcwyFoEphwrfYc0acOQvmPg"
                    />
                </div>
            </section>

            {/* Instant Search Bar */}
            <section className="mx-auto max-w-2xl pb-2 shadow-sm">
                <div className="relative">
                    <span className="material-symbols-outlined text-outline absolute top-1/2 left-4.5 -translate-y-1/2 text-xl">
                        <MdOutlineSearch />
                    </span>
                    <input
                        type="text"
                        placeholder="Search organic fruits, vegetables, dairy, baked bread, farm honey..."
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            navigate('/discovery');
                        }}
                        className="border-outline-variant/50 focus:ring-primary hover:border-primary/40 w-full rounded-full border bg-white py-4 pr-4 pl-12 text-sm font-medium shadow-md transition-all duration-150 outline-none focus:scale-[1.01] focus:border-transparent focus:ring-2"
                    />
                </div>
            </section>

            {/* Grid Categorization Row */}
            <section className="border-outline-variant/15 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-on-surface text-[18px] font-extrabold tracking-tight">
                            Browse Categories
                        </h3>
                        <p className="text-outline mt-0.5 text-xs font-bold uppercase">
                            Explore by specific produce types
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/discovery')}
                        className="text-primary flex items-center gap-1 text-xs font-black tracking-wider uppercase hover:underline"
                    >
                        See All Produce
                        <span className="material-symbols-outlined text-base">
                            <MdOutlineArrowForward />
                        </span>
                    </button>
                </div>

                <div className="custom-scrollbar flex gap-5 overflow-x-auto pb-3">
                    {[
                        'Fruits',
                        'Vegetables',
                        'Dairy',
                        'Bakery',
                        'Household',
                    ].map((cat) => {
                        const icons: { [key: string]: ReactNode } = {
                            Fruits: <GiShinyApple />,
                            Vegetables: <GiCabbage />,
                            Dairy: <GiMilkCarton />,
                            Bakery: <MdOutlineBakeryDining />,
                            Household: 'home_app_logo',
                        };
                        return (
                            <div
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className="group flex w-24 flex-none cursor-pointer flex-col items-center gap-2"
                            >
                                <div className="bg-secondary-container/50 hover:bg-secondary-container group-hover:border-primary/40 flex h-16 w-16 items-center justify-center rounded-full border-2 border-transparent transition-all group-hover:scale-105">
                                    <span className="material-symbols-outlined text-primary text-[28px]">
                                        {icons[cat] || 'spa'}
                                    </span>
                                </div>
                                <span className="text-on-surface group-hover:text-primary text-center text-xs font-black transition-colors">
                                    {cat}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Weekly Highlights Banner / Shopping Grid */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-on-surface text-xl font-extrabold tracking-tight">
                            Weekly Harvest Highlights
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold text-[#6B705C]">
                            Straight from our farms to your doorstep
                        </p>
                    </div>
                    <span className="bg-primary/10 text-primary border-primary/20 rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                        Organic Certified
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.slice(0, 4).map((p) => (
                        <div
                            key={p.id}
                            className="group border-outline-variant/20 flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="relative aspect-square overflow-hidden bg-slate-50">
                                <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {p.isOrganic && (
                                    <span className="absolute top-2.5 left-2.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
                                        Organic
                                    </span>
                                )}
                                <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 rounded-lg border border-amber-100 bg-white/95 px-1.5 py-0.5 text-[10px] font-black text-amber-500 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-xs">
                                        star
                                    </span>
                                    {p.rating}
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-4">
                                <div className="space-y-1">
                                    <span className="text-outline block text-[10px] font-bold tracking-wider uppercase">
                                        {p.category}
                                    </span>
                                    <h4 className="text-on-surface truncate text-[15px] leading-snug font-bold">
                                        {p.name}
                                    </h4>
                                    <p className="text-on-surface-variant text-xs font-medium">
                                        {p.quantityText}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-outline text-[10px] leading-none font-semibold uppercase">
                                            Price
                                        </span>
                                        <span className="text-primary text-base font-black">
                                            KSh {p.price}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => addToCart(p)}
                                        className="text-on-background flex cursor-pointer items-center justify-center rounded-xl bg-amber-400 p-2.5 font-bold shadow-sm transition-all hover:bg-amber-500 hover:shadow active:scale-90"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            <MdOutlineAddShoppingCart />
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sustainable Offer Banner */}
            <section className="pt-2">
                <div className="relative flex w-full flex-col items-center overflow-hidden rounded-2xl bg-[#006e1c] p-6 text-white transition-shadow hover:shadow-md md:flex-row md:p-8">
                    <div className="relative z-10 max-w-full space-y-4 text-center md:max-w-[60%] md:text-left">
                        <span className="inline-block rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#cfffc3] uppercase">
                            Seasonal Bounty
                        </span>
                        <h3 className="font-caveat text-4xl leading-tight font-black text-white md:text-5xl">
                            Seasonal Berry Fest!
                        </h3>
                        <p className="max-w-md text-sm leading-relaxed text-emerald-50">
                            Get up to 25% off all local greenhouse organic
                            strawberries and natural honeys this week!
                        </p>
                        <button
                            onClick={() => handleCategoryClick('Fruits')}
                            className="text-primary cursor-pointer rounded-full bg-white px-6 py-3 text-xs font-extrabold tracking-wider uppercase shadow-sm transition-transform hover:bg-emerald-50 hover:shadow active:scale-95"
                        >
                            Shop Fruits Harvest
                        </button>
                    </div>
                    <div className="pointer-events-none absolute top-0 right-0 bottom-0 flex w-full items-center justify-center overflow-hidden opacity-20 md:w-1/2 md:opacity-100">
                        <img
                            className="h-full w-full rounded-l-2xl object-cover md:scale-105"
                            src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=400"
                            alt="Summer berries illustration"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="w-full py-6">
                <h2 className="font-caveat text-primary mb-8 text-center text-4xl font-black md:text-5xl">
                    How FreshDrop Works
                </h2>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center md:grid-cols-3">
                    <div className="border-outline-variant/15 flex flex-col items-center gap-3 rounded-2xl border bg-white p-5 shadow-sm duration-200 hover:scale-[1.02]">
                        <div className="bg-primary-container/20 flex h-16 w-16 items-center justify-center rounded-full">
                            <span className="material-symbols-outlined text-primary text-3xl">
                                <MdSmartphone />
                            </span>
                        </div>
                        <h4 className="text-on-surface text-base font-bold">
                            1. Browse & Select
                        </h4>
                        <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                            Choose from thousands of organic premium items from
                            your favorite local stores and sustainable family
                            lands.
                        </p>
                    </div>

                    <div className="border-outline-variant/15 flex flex-col items-center gap-3 rounded-2xl border bg-white p-5 shadow-sm duration-200 hover:scale-[1.02]">
                        <div className="bg-primary-container/20 flex h-16 w-16 items-center justify-center rounded-full">
                            <span className="material-symbols-outlined text-primary text-3xl">
                                <MdOutlineShoppingCart />
                            </span>
                        </div>
                        <h4 className="text-on-surface text-base font-bold">
                            2. Order & Track
                        </h4>
                        <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                            We carefully pick your organic assets directly from
                            fields and keep you updated at every milestone.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#becab9]/25 bg-white p-5 shadow-sm duration-200 hover:scale-[1.02]">
                        <div className="bg-primary-container/20 flex h-16 w-16 items-center justify-center rounded-full">
                            <span className="material-symbols-outlined text-primary text-3xl">
                                <MdMoped />
                            </span>
                        </div>
                        <h4 className="text-on-surface text-base font-bold">
                            3. Delivered directly
                        </h4>
                        <p className="text-on-surface-variant text-xs leading-relaxed font-medium">
                            Get fresh organic food at your kitchen table in
                            under 2 hours, exactly when you need them.
                        </p>
                    </div>
                </div>
            </section>

            {/* Founders Mission Section */}
            <section className="w-full">
                <div className="bg-secondary-container/40 relative mx-auto max-w-2xl rounded-2xl border border-[#becab9]/40 p-8 text-center shadow-sm">
                    <span className="material-symbols-outlined text-primary/30 absolute -top-6 left-1/2 -translate-x-1/2 bg-[#f9f9ff] px-2.5 text-5xl">
                        <MdOutlineFormatQuote />
                    </span>
                    <h2 className="font-caveat text-primary mb-3 text-3xl font-black">
                        Our Mission
                    </h2>
                    <p className="text-on-surface-variant mb-5 text-sm leading-relaxed font-semibold italic">
                        "We got tired of spending our entire Saturday grocery
                        shopping, so we are building a better, direct, and
                        fairer way for our community."
                    </p>
                    <p className="text-primary text-xs font-black tracking-wider uppercase">
                        — The Founders of FreshDrop
                    </p>
                </div>
            </section>
        </div>
    );
}
