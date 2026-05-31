import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import Footer from './Components/Footer';
import Header from './Components/Header';
import Navigation from './Components/Navigation';
import SkeletonLoader from './Components/SkeletonLoader';
//import { useDeliveryStore } from './Store/delivery';
import { useStore } from './Store/productStore';

const Home = lazy(() => import('./Pages/Home'));
const Discovery = lazy(() => import('./Pages/Discovery'));
const Cart = lazy(() => import('./Pages/Cart'));
const History = lazy(() => import('./Pages/History'));
const Profile = lazy(() => import('./Pages/Profile'));
const Auth = lazy(() => import('./Pages/Auth'));

export default function App() {
    //const navigate = useNavigate();
    const { user } = useStore();
    //const { deliveryLocation, showCheckoutModal, setSearchQuery } = useAppContext();
    //const setSearchQuery = useDeliveryStore((state) => state.setSearchQuery);

    //const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

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
                                <Header />

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
