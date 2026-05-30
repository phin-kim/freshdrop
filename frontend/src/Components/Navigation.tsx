import { useLocation, useNavigate } from 'react-router';
import { useStore } from '../Store/productStore';
//import { useAppContext } from '../AppContext';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, cart } = useStore();
  const { setSearchQuery, setSelectedCategory } = useAppContext();

  if (!user) return null;

  const currentPath = location.pathname;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleNavigate = (path: string) => {
    if (path === "/") {
      setSearchQuery("");
    } else if (path === "/discovery") {
      setSelectedCategory("All Items");
    }
    navigate(path);
  };

  return (
    <>
      {/* MOBILE SCREEN NAVIGATION (sticky bottom bar) */}
      <nav id="mobile-nav" className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center pt-2 pb-safe px-4 bg-white shadow-lg rounded-t-2xl border-t border-outline-variant/20 md:hidden">
        <button
          onClick={() => handleNavigate("/")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
            currentPath === "/"
              ? "bg-primary-container/20 text-primary font-bold scale-105"
              : "text-outline hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: currentPath === "/" ? "'FILL' 1" : undefined }}>home</span>
          <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">Home</span>
        </button>

        <button
          onClick={() => handleNavigate("/discovery")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
            currentPath === "/discovery"
              ? "bg-primary-container/20 text-primary font-bold scale-105"
              : "text-outline hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: currentPath === "/discovery" ? "'FILL' 1" : undefined }}>search</span>
          <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">Discovery</span>
        </button>

        <button
          onClick={() => handleNavigate("/cart")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer relative ${
            currentPath === "/cart"
              ? "bg-primary-container/20 text-primary font-bold scale-105"
              : "text-outline hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: currentPath === "/cart" ? "'FILL' 1" : undefined }}>shopping_cart</span>
          {cartCount > 0 && (
            <span className="absolute top-1 right-2 bg-rose-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">Cart</span>
        </button>

        <button
          onClick={() => handleNavigate("/profile")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
            currentPath === "/profile"
              ? "bg-primary-container/20 text-primary font-bold scale-105"
              : "text-outline hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: currentPath === "/profile" ? "'FILL' 1" : undefined }}>person</span>
          <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">Profile</span>
        </button>
      </nav>

      {/* DESKTOP/LARGER SCREEN NAVIGATION (Hover-expanding side bar) */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col justify-between fixed left-0 top-0 bottom-0 h-screen bg-white border-r border-[#becab9]/45 shadow-xl transition-all duration-300 ease-in-out group z-50 w-16 hover:w-64"
      >
        {/* Top Part: Branding */}
        <div className="flex items-center gap-3 p-4 border-b border-outline-variant/10 overflow-hidden h-16 shrink-0 bg-surface-container-lowest">
          <span className="material-symbols-outlined text-primary text-3xl font-extrabold transform group-hover:rotate-12 transition-transform duration-300 select-none">
            eco
          </span>
          <span className="font-caveat text-2xl font-black text-primary transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden">
            FreshDrop
          </span>
        </div>

        {/* Middle Part: Navigation Links */}
        <div className="flex-grow py-6 px-2 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Home Link */}
          <button
            onClick={() => handleNavigate("/")}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 cursor-pointer group/item ${
              currentPath === "/"
                ? "bg-primary text-white font-extrabold shadow-md animate-pulse-once"
                : "text-outline hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-2xl shrink-0">home</span>
            <span className="text-xs tracking-wider font-extrabold uppercase transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap">
              Home Page
            </span>
          </button>

          {/* Discovery Link */}
          <button
            onClick={() => handleNavigate("/discovery")}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 cursor-pointer group/item ${
              currentPath === "/discovery"
                ? "bg-primary text-white font-extrabold shadow-md"
                : "text-outline hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-2xl shrink-0">search</span>
            <span className="text-xs tracking-wider font-extrabold uppercase transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap">
              Explore Store
            </span>
          </button>

          {/* Cart Link */}
          <button
            onClick={() => handleNavigate("/cart")}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 cursor-pointer relative group/item ${
              currentPath === "/cart"
                ? "bg-primary text-white font-extrabold shadow-md"
                : "text-outline hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">shopping_cart</span>
              {cartCount > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white transition-all ${currentPath === '/cart' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs tracking-wider font-extrabold uppercase transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap">
              My Basket ({cartCount})
            </span>
          </button>

          {/* History Link */}
          <button
            onClick={() => handleNavigate("/history")}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 cursor-pointer group/item ${
              currentPath === "/history"
                ? "bg-primary text-white font-extrabold shadow-md"
                : "text-outline hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-2xl shrink-0">receipt_long</span>
            <span className="text-xs tracking-wider font-extrabold uppercase transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap">
              Order History
            </span>
          </button>

          {/* Profile Link */}
          <button
            onClick={() => handleNavigate("/profile")}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 cursor-pointer group/item ${
              currentPath === "/profile"
                ? "bg-primary text-white font-extrabold shadow-md"
                : "text-outline hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-2xl shrink-0">person</span>
            <span className="text-xs tracking-wider font-extrabold uppercase transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap">
              Profile Settings
            </span>
          </button>
        </div>

        {/* Bottom Part: User info & logout */}
        <div className="p-3 border-t border-outline-variant/10 shrink-0 bg-surface-container-lowest gap-3 flex flex-col">
          {/* Mini User badge */}
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNavigate("/profile")}>
            <img
              alt={user.name}
              src={user.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
              className="w-10 h-10 rounded-full bg-emerald-100 border border-primary/20 object-cover shrink-0"
            />
            <div className="flex flex-col transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap">
              <span className="text-xs font-black text-on-surface truncate leading-tight block">{user.name}</span>
              <span className="text-[10px] text-outline font-extrabold uppercase tracking-wide truncate">{user.email}</span>
            </div>
          </div>

          {/* Expanded Logout option */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-4 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl shrink-0">logout</span>
            <span className="text-xs tracking-wider font-bold transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap">
              Sign Out Account
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
