import {
    MdLogout,
    MdOutlineEco,
    MdOutlineHome,
    MdOutlinePerson2,
    MdOutlineReceiptLong,
    MdOutlineSearch,
    MdOutlineShoppingCart,
} from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router';

import { useAuthStore } from '../Store/authStore';
import { useDeliveryStore } from '../Store/delivery';
import { useStore } from '../Store/productStore';

//import { useAppContext } from '../AppContext';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, cart } = useStore();
    const user = useAuthStore((state) => state.user);
    const setSearchQuery = useDeliveryStore((state) => state.setSearchQuery);
    const setSelectedCategory = useDeliveryStore(
        (state) => state.setSelectedCategory
    );

    const currentPath = location.pathname;
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

    const handleNavigate = (path: string) => {
        if (path === '/') {
            setSearchQuery('');
        } else if (path === '/discovery') {
            setSelectedCategory('All Items');
        }
        navigate(path);
    };

    return (
        <>
            {/* MOBILE SCREEN NAVIGATION (sticky bottom bar) */}
            <nav
                id="mobile-nav"
                className="pb-safe border-outline-variant/20 fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-t-2xl border-t bg-white px-4 pt-2 shadow-lg md:hidden"
            >
                <button
                    onClick={() => handleNavigate('/')}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all duration-200 ${
                        currentPath === '/'
                            ? 'bg-primary-container/20 text-primary scale-105 font-bold'
                            : 'text-outline hover:text-primary'
                    }`}
                >
                    <span
                        className="material-symbols-outlined text-2xl"
                        style={{
                            fontVariationSettings:
                                currentPath === '/' ? "'FILL' 1" : undefined,
                        }}
                    >
                        <MdOutlineHome />
                    </span>
                    <span className="mt-0.5 text-[10px] font-black tracking-wider uppercase">
                        Home
                    </span>
                </button>

                <button
                    onClick={() => handleNavigate('/discovery')}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all duration-200 ${
                        currentPath === '/discovery'
                            ? 'bg-primary-container/20 text-primary scale-105 font-bold'
                            : 'text-outline hover:text-primary'
                    }`}
                >
                    <span
                        className="material-symbols-outlined text-2xl"
                        style={{
                            fontVariationSettings:
                                currentPath === '/discovery'
                                    ? "'FILL' 1"
                                    : undefined,
                        }}
                    >
                        <MdOutlineSearch />
                    </span>
                    <span className="mt-0.5 text-[10px] font-black tracking-wider uppercase">
                        Discovery
                    </span>
                </button>

                <button
                    onClick={() => handleNavigate('/cart')}
                    className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all duration-200 ${
                        currentPath === '/cart'
                            ? 'bg-primary-container/20 text-primary scale-105 font-bold'
                            : 'text-outline hover:text-primary'
                    }`}
                >
                    <span
                        className="material-symbols-outlined text-2xl"
                        style={{
                            fontVariationSettings:
                                currentPath === '/cart'
                                    ? "'FILL' 1"
                                    : undefined,
                        }}
                    >
                        <MdOutlineShoppingCart />
                    </span>
                    {cartCount > 0 && (
                        <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white">
                            {cartCount}
                        </span>
                    )}
                    <span className="mt-0.5 text-[10px] font-black tracking-wider uppercase">
                        Cart
                    </span>
                </button>

                <button
                    onClick={() => handleNavigate('/profile')}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all duration-200 ${
                        currentPath === '/profile'
                            ? 'bg-primary-container/20 text-primary scale-105 font-bold'
                            : 'text-outline hover:text-primary'
                    }`}
                >
                    <span
                        className="material-symbols-outlined text-2xl"
                        style={{
                            fontVariationSettings:
                                currentPath === '/profile'
                                    ? "'FILL' 1"
                                    : undefined,
                        }}
                    >
                        <MdOutlinePerson2 />
                    </span>
                    <span className="mt-0.5 text-[10px] font-black tracking-wider uppercase">
                        Profile
                    </span>
                </button>
            </nav>

            {/* DESKTOP/LARGER SCREEN NAVIGATION (Hover-expanding side bar) */}
            <aside
                id="desktop-sidebar"
                className="group fixed top-0 bottom-0 left-0 z-50 hidden h-screen w-16 flex-col justify-between border-r border-[#becab9]/45 bg-white shadow-xl transition-all duration-300 ease-in-out hover:w-64 md:flex"
            >
                {/* Top Part: Branding */}
                <div className="border-outline-variant/10 bg-surface-container-lowest flex h-16 shrink-0 items-center gap-3 overflow-hidden border-b p-4">
                    <span className="material-symbols-outlined text-primary transform text-3xl font-extrabold transition-transform duration-300 select-none group-hover:rotate-12">
                        <MdOutlineEco />
                    </span>
                    <span className="font-caveat text-primary max-w-0 overflow-hidden text-2xl font-black whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                        FreshDrop
                    </span>
                </div>

                {/* Middle Part: Navigation Links */}
                <div className="custom-scrollbar flex-grow space-y-4 overflow-x-hidden overflow-y-auto px-2 py-6">
                    {/* Home Link */}
                    <button
                        onClick={() => handleNavigate('/')}
                        className={`group/item flex w-full cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all duration-200 ${
                            currentPath === '/'
                                ? 'bg-primary animate-pulse-once font-extrabold text-white shadow-md'
                                : 'text-outline hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                        <span className="material-symbols-outlined shrink-0 text-2xl">
                            <MdOutlineHome />
                        </span>
                        <span className="max-w-0 overflow-hidden text-xs font-extrabold tracking-wider whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                            Home Page
                        </span>
                    </button>

                    {/* Discovery Link */}
                    <button
                        onClick={() => handleNavigate('/discovery')}
                        className={`group/item flex w-full cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all duration-200 ${
                            currentPath === '/discovery'
                                ? 'bg-primary font-extrabold text-white shadow-md'
                                : 'text-outline hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                        <span className="material-symbols-outlined shrink-0 text-2xl">
                            <MdOutlineSearch />
                        </span>
                        <span className="max-w-0 overflow-hidden text-xs font-extrabold tracking-wider whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                            Explore Store
                        </span>
                    </button>

                    {/* Cart Link */}
                    <button
                        onClick={() => handleNavigate('/cart')}
                        className={`group/item relative flex w-full cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all duration-200 ${
                            currentPath === '/cart'
                                ? 'bg-primary font-extrabold text-white shadow-md'
                                : 'text-outline hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                        <div className="relative flex shrink-0 items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">
                                <MdOutlineShoppingCart />
                            </span>
                            {cartCount > 0 && (
                                <span
                                    className={`absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white text-[9px] font-extrabold text-white transition-all ${currentPath === '/cart' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                >
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="max-w-0 overflow-hidden text-xs font-extrabold tracking-wider whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                            My Basket ({cartCount})
                        </span>
                    </button>

                    {/* History Link */}
                    <button
                        onClick={() => handleNavigate('/history')}
                        className={`group/item flex w-full cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all duration-200 ${
                            currentPath === '/history'
                                ? 'bg-primary font-extrabold text-white shadow-md'
                                : 'text-outline hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                        <span className="material-symbols-outlined shrink-0 text-2xl">
                            <MdOutlineReceiptLong />
                        </span>
                        <span className="max-w-0 overflow-hidden text-xs font-extrabold tracking-wider whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                            Order History
                        </span>
                    </button>

                    {/* Profile Link */}
                    <button
                        onClick={() => handleNavigate('/profile')}
                        className={`group/item flex w-full cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all duration-200 ${
                            currentPath === '/profile'
                                ? 'bg-primary font-extrabold text-white shadow-md'
                                : 'text-outline hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                        <span className="material-symbols-outlined shrink-0 text-2xl">
                            <MdOutlinePerson2 />
                        </span>
                        <span className="max-w-0 overflow-hidden text-xs font-extrabold tracking-wider whitespace-nowrap uppercase opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                            Profile Settings
                        </span>
                    </button>
                </div>

                {/* Bottom Part: User info & logout */}
                <div className="border-outline-variant/10 bg-surface-container-lowest flex shrink-0 flex-col gap-3 border-t p-3">
                    {/* Mini User badge */}
                    <div
                        className="flex cursor-pointer items-center gap-3 overflow-hidden"
                        onClick={() => handleNavigate('/profile')}
                    >
                        <img
                            alt={user?.name}
                            src={
                                user?.avatar ||
                                'https://api.dicebear.com/7.x/adventurer/svg?seed=user'
                            }
                            className="border-primary/20 h-10 w-10 shrink-0 rounded-full border bg-emerald-100 object-cover"
                        />
                        <div className="flex max-w-0 flex-col overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                            <span className="text-on-surface block truncate text-xs leading-tight font-black">
                                {user?.name}
                            </span>
                            <span className="text-outline truncate text-[10px] font-extrabold tracking-wide uppercase">
                                {user?.email}
                            </span>
                        </div>
                    </div>

                    {/* Expanded Logout option */}
                    <button
                        onClick={signOut}
                        className="flex w-full cursor-pointer items-center gap-4 rounded-xl p-2.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-800"
                    >
                        <span className="material-symbols-outlined shrink-0 text-2xl">
                            <MdLogout />
                        </span>
                        <span className="max-w-0 overflow-hidden text-xs font-bold tracking-wider whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
                            Sign Out Account
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
