import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import Footer from './Components/Footer';
import Navigation from './Components/Navigation';
import SkeletonLoader from './Components/SkeletonLoader';
import { useDeliveryStore } from './Store/delivery';
import { useStore } from './Store/productStore';

const Home = lazy(() => import('./Pages/Home'));
const Discovery = lazy(() => import('./Pages/Discovery'));
const Cart = lazy(() => import('./Pages/Cart'));
const History = lazy(() => import('./Pages/History'));
const Profile = lazy(() => import('./Pages/Profile'));
const Auth = lazy(() => import('./Pages/Auth'));

export default function App() {
    //const navigate = useNavigate();
    const { user, cart, addToast } = useStore();
    //const { deliveryLocation, showCheckoutModal, setSearchQuery } = useAppContext();
    const setSearchQuery = useDeliveryStore((state) => state.setSearchQuery);
    const deliveryLocation = useDeliveryStore(
        (state) => state.deliveryLocation
    );
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

    const handleLogoClick = () => {
        setSearchQuery('');
        //navigate("/");
    };
    return (
        <div className="text-on-surface bg-background font-inter flex min-h-screen flex-col">
            <BrowserRouter>
                <Suspense
                    fallback={
                        <div className="bg-background flex min-h-screen items-center justify-center">
                            <SkeletonLoader type="home" />
                        </div>
                    }
                >
                    {!user ? (
                        /* Guest/Unauthenticated Routing Layout */
                        <Routes>
                            <Route path="/auth/login" element={<Auth />} />
                            <Route path="/auth/signup" element={<Auth />} />
                            <Route
                                path="*"
                                element={<Navigate to="/auth/login" replace />}
                            />
                        </Routes>
                    ) : (
                        /* Authenticated Router Layout with Side/Bottom Nav, Header, Main, and Footer */
                        <div className="relative flex min-h-screen w-full flex-col md:flex-row">
                            <Navigation />

                            <div className="flex min-h-screen w-full max-w-full flex-grow flex-col overflow-x-hidden pb-24 md:pb-8 md:pl-16">
                                {/* Header Bar */}
                                <header className="border-outline-variant/10 sticky top-0 z-40 border-b bg-white shadow-sm">
                                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary text-3xl font-bold">
                                                location_on
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-extrabold tracking-widest text-[#6B705C] uppercase">
                                                    DELIVER TO
                                                </span>
                                                <span
                                                    id="deliver-destination-header"
                                                    className="text-primary text-sm font-bold"
                                                >
                                                    {deliveryLocation}
                                                </span>
                                            </div>
                                        </div>

                                        <h1
                                            onClick={handleLogoClick}
                                            className="font-caveat text-primary flex cursor-pointer items-center gap-1.5 text-3xl font-bold select-none hover:opacity-90 md:text-4xl"
                                        >
                                            <span className="material-symbols-outlined">
                                                eco
                                            </span>
                                            FreshDrop
                                        </h1>

                                        {/* Profile badge and quick triggers */}
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                onClick={() =>
                                                    addToast(
                                                        'All digital systems healthy. No new alerts!',
                                                        'info'
                                                    )
                                                }
                                                className="hover:bg-surface-container-low relative cursor-pointer rounded-full p-2.5 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-primary text-2xl font-bold">
                                                    notifications
                                                </span>
                                                <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-rose-500"></span>
                                            </button>

                                            <button
                                                //onClick={() => navigate("/cart")}
                                                className="hover:bg-surface-container-low relative cursor-pointer rounded-full p-2.5 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-primary text-2xl font-bold">
                                                    shopping_cart
                                                </span>
                                                {cartCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[10px] font-extrabold text-white">
                                                        {cartCount}
                                                    </span>
                                                )}
                                            </button>

                                            <div
                                                //onClick={() => navigate("/profile")}
                                                className="border-outline-variant/40 flex cursor-pointer items-center gap-2 border-l pl-3 hover:opacity-95"
                                            >
                                                <img
                                                    alt={user.name}
                                                    src={
                                                        user.avatar ||
                                                        'https://api.dicebear.com/7.x/adventurer/svg?seed=user'
                                                    }
                                                    className="border-primary/20 h-9 w-9 rounded-full border bg-emerald-100 object-cover"
                                                />
                                                <div className="hidden flex-col text-left md:flex">
                                                    <span className="text-xs leading-none font-bold">
                                                        {
                                                            user.name.split(
                                                                ' '
                                                            )[0]
                                                        }
                                                    </span>
                                                    <span className="text-primary mt-0.5 text-[9px] font-extrabold tracking-wide uppercase">
                                                        Gold Member
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </header>

                                {/* Main Routing Screen Canvas */}
                                <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-6 md:px-8">
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route
                                            path="/discovery"
                                            element={<Discovery />}
                                        />
                                        <Route
                                            path="/cart"
                                            element={<Cart />}
                                        />
                                        <Route
                                            path="/history"
                                            element={<History />}
                                        />
                                        <Route
                                            path="/profile"
                                            element={<Profile />}
                                        />
                                        <Route
                                            path="*"
                                            element={
                                                <Navigate to="/" replace />
                                            }
                                        />
                                    </Routes>
                                </main>

                                {/* Footer Component */}
                                <Footer />
                            </div>
                        </div>
                    )}
                </Suspense>
            </BrowserRouter>
        </div>
    );
}
