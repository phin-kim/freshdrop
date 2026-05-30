import { FormEvent } from 'react';
import { useStore } from '../Store/productStore';
import { useAppContext } from '../AppContext';
import { useNavigate } from 'react-router';
export default function TabHome() {
  const navigate = useNavigate();
  const { products, addToCart, addToast } = useStore();
  const {
    setSearchQuery,
    setSelectedCategory,
    deliveryLocation,
    setDeliveryLocation,
    deliveryLocationInput,
    setDeliveryLocationInput
  } = useAppContext();

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    navigate("/discovery");
  };

  const handleLocationSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (deliveryLocationInput.trim()) {
      setDeliveryLocation(deliveryLocationInput);
      addToast(`Delivery destination updated to: ${deliveryLocationInput}`, "success");
    }
  };

  const handleUseCurrentLocation = () => {
    setDeliveryLocationInput("Downtown, SF");
    setDeliveryLocation("Downtown, SF");
    addToast("Set delivery address to current location: Downtown, SF", "success");
  };

  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-8 mt-4 mb-4">
        {/* Left Side: Copy and Controls */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <h2 className="font-caveat text-5xl md:text-6xl text-primary font-black tracking-tight leading-tight">
            Fresh Groceries Delivered in Under 2 Hours.
          </h2>
          
          <p className="font-sans text-base md:text-lg text-on-surface-variant max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
            Skip the checkout lines. We source directly from certified organic farms, local kiosks, and supermarkets, delivering straight to your table.
          </p>

          {/* Delivery form widget combined */}
          <div className="bg-white rounded-2xl border border-outline-variant/40 p-5 shadow-sm space-y-4 max-w-xl mx-auto lg:mx-0">
            <div className="text-left">
              <span className="text-[10px] font-extrabold tracking-widest text-[#6B705C] uppercase block mb-1">DELIVER TO</span>
              <span className="text-base font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">location_on</span>
                {deliveryLocation}
              </span>
            </div>

            <form onSubmit={handleLocationSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                  map
                </span>
                <input
                  type="text"
                  placeholder="Enter your delivery destination"
                  value={deliveryLocationInput}
                  onChange={(e) => setDeliveryLocationInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-outline-variant/60 rounded-xl bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="submit"
                  className="bg-primary hover:bg-[#005313] text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform duration-150 active:scale-95 text-xs uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Update Destination
                </button>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="border border-[#becab9] bg-white text-primary hover:bg-emerald-50 font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform duration-150 active:scale-95 text-xs uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">my_location</span>
                  Use current location
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Spectacular organic crop photo illustration */}
        <div className="flex-1 max-w-xs md:max-w-md lg:max-w-xl">
          <img
            alt="Fresh crop harvest illustration"
            className="w-full h-auto object-contain pointer-events-none drop-shadow-lg"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv5Z2qP1uwzBR51qh2Q3vHpUfhD2rRvgaBTzv3_weIGiMqOVXmX50q3wMeY6_FeAbrH2LRENF-gj2jx8G2NdwEwb45Qf4eqkT1rFp3gL3gPz7Ixj3_YybUthoJVXkOPv_02zwxQTcNrxrq4oVOeb50MYwxvXuph3_8cFXp-qwyY9XujDyowlcFsuOpwVS1ip5C1eVhuiztU81lc2SHkm-ZwW_GrMiSvwIfJWklX3Oo1O308TcAjlpOcwyFoEphwrfYc0acOQvmPg"
          />
        </div>
      </section>

      {/* Instant Search Bar */}
      <section className="max-w-2xl mx-auto shadow-sm pb-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4.5 top-1/2 -translate-y-1/2 text-outline text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search organic fruits, vegetables, dairy, baked bread, farm honey..."
            onChange={(e) => {
              setSearchQuery(e.target.value);
              navigate("/discovery");
            }}
            className="w-full bg-white border border-outline-variant/50 rounded-full py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-md text-sm outline-none font-medium hover:border-primary/40 focus:scale-[1.01] duration-150"
          />
        </div>
      </section>

      {/* Grid Categorization Row */}
      <section className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-[18px] tracking-tight text-on-surface">Browse Categories</h3>
            <p className="text-xs text-outline font-bold uppercase mt-0.5">Explore by specific produce types</p>
          </div>
          <button
            onClick={() => handleCategoryClick("All Items")}
            className="text-primary font-black text-xs tracking-wider uppercase hover:underline flex items-center gap-1"
          >
            See All Produce
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

        <div className="flex gap-5 overflow-x-auto custom-scrollbar pb-3">
          {["Fruits", "Vegetables", "Dairy", "Bakery", "Household"].map((cat) => {
            const icons: { [key: string]: string } = {
              Fruits: "apple",
              Vegetables: "nutrition",
              Dairy: "lactating_dairy",
              Bakery: "bakery_dining",
              Household: "home_app_logo"
            };
            return (
              <div
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="flex-none w-24 flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-secondary-container/50 hover:bg-secondary-container flex items-center justify-center transition-all group-hover:scale-105 border-2 border-transparent group-hover:border-primary/40">
                  <span className="material-symbols-outlined text-[28px] text-primary">{icons[cat] || "spa"}</span>
                </div>
                <span className="text-xs font-black text-on-surface text-center group-hover:text-primary transition-colors">{cat}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly Highlights Banner / Shopping Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-xl tracking-tight text-on-surface">Weekly Harvest Highlights</h3>
            <p className="text-xs text-[#6B705C] font-semibold mt-0.5">Straight from our farms to your doorstep</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black tracking-widest uppercase">
            Organic Certified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map(p => (
            <div key={p.id} className="group bg-white rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {p.isOrganic && (
                  <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Organic
                  </span>
                )}
                <span className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-amber-500 text-[10px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 border border-amber-100">
                  <span className="material-symbols-outlined text-xs">star</span>
                  {p.rating}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-outline tracking-wider uppercase block">{p.category}</span>
                  <h4 className="text-[15px] font-bold text-on-surface truncate leading-snug">{p.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium">{p.quantityText}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-outline font-semibold uppercase leading-none">Price</span>
                    <span className="text-base font-black text-primary">KSh {p.price}</span>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-on-background flex items-center justify-center shadow-sm hover:shadow active:scale-90 transition-all font-bold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainable Offer Banner */}
      <section className="pt-2">
        <div className="w-full rounded-2xl bg-[#006e1c] text-white relative overflow-hidden flex flex-col md:flex-row items-center p-6 md:p-8 hover:shadow-md transition-shadow">
          <div className="relative z-10 max-w-full md:max-w-[60%] text-center md:text-left space-y-4">
            <span className="px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#cfffc3] inline-block">
              Seasonal Bounty
            </span>
            <h3 className="font-caveat text-4xl md:text-5xl font-black text-white leading-tight">Seasonal Berry Fest!</h3>
            <p className="text-sm text-emerald-50 leading-relaxed max-w-md">Get up to 25% off all local greenhouse organic strawberries and natural honeys this week!</p>
            <button
              onClick={() => handleCategoryClick("Fruits")}
              className="bg-white text-primary hover:bg-emerald-50 px-6 py-3 rounded-full font-extrabold text-xs uppercase tracking-wider shadow-sm hover:shadow active:scale-95 transition-transform cursor-pointer"
            >
              Shop Fruits Harvest
            </button>
          </div>
          <div className="absolute right-0 bottom-0 top-0 opacity-20 md:opacity-100 w-full md:w-1/2 flex items-center justify-center overflow-hidden pointer-events-none">
            <img
              className="w-full h-full object-cover rounded-l-2xl md:scale-105"
              src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=400"
              alt="Summer berries illustration"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-6">
        <h2 className="font-caveat text-4xl md:text-5xl text-primary text-center font-black mb-8">How FreshDrop Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-outline-variant/15 shadow-sm hover:scale-[1.02] duration-200">
            <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">smartphone</span>
            </div>
            <h4 className="font-bold text-base text-on-surface">1. Browse & Select</h4>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">Choose from thousands of organic premium items from your favorite local stores and sustainable family lands.</p>
          </div>

          <div className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-outline-variant/15 shadow-sm hover:scale-[1.02] duration-200">
            <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">shopping_cart</span>
            </div>
            <h4 className="font-bold text-base text-on-surface">2. Order & Track</h4>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">We carefully pick your organic assets directly from fields and keep you updated at every milestone.</p>
          </div>

          <div className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-[#becab9]/25 shadow-sm hover:scale-[1.02] duration-200">
            <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">moped</span>
            </div>
            <h4 className="font-bold text-base text-on-surface">3. Delivered directly</h4>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">Get fresh organic food at your kitchen table in under 2 hours, exactly when you need them.</p>
          </div>
        </div>
      </section>

      {/* Founders Mission Section */}
      <section className="w-full">
        <div className="bg-secondary-container/40 border border-[#becab9]/40 rounded-2xl p-8 text-center max-w-2xl mx-auto relative shadow-sm">
          <span className="material-symbols-outlined text-primary/30 text-5xl absolute -top-6 left-1/2 -translate-x-1/2 bg-[#f9f9ff] px-2.5">
            format_quote
          </span>
          <h2 className="font-caveat text-3xl font-black text-primary mb-3">Our Mission</h2>
          <p className="text-sm text-on-surface-variant font-semibold italic mb-5 leading-relaxed">
            "We got tired of spending our entire Saturday grocery shopping, so we are building a better, direct, and fairer way for our community."
          </p>
          <p className="text-xs text-primary font-black uppercase tracking-wider">— The Founders of FreshDrop</p>
        </div>
      </section>

    </div>
  );
}
