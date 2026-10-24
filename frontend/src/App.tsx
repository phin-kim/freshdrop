import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import Footer from './Components/Layout/Footer';
import Header from './Components/Layout/Header';
import Navigation from './Components/Layout/Navigation';
import SkeletonLoader from './Components/Layout/SkeletonLoader';
import ErrorToast from './Components/Others/ErrorToast';
import InfoToast from './Components/Others/InfoToast';
import NotificationDrawer from './Components/Others/Notifications';
import Setup2FA from './Components/Others/Setup2FA';
import SuccessToast from './Components/Others/SuccessToast';
import Verify2FA from './Components/Others/Verify2FA';
import WarningToast from './Components/Others/WarningToast';
import ProtectedRoutes from './Components/Pages/ProtectedRoutes';
import RiderActivation from './Components/Pages/RiderActivation';
import Cookies from './Pages/Cookies';
import RiderDashboard from './Pages/CourierDashboard';
import Landing from './Pages/Landing';
import Privacy from './Pages/Privacy';
import ResetPassword from './Pages/ResetPassword';
import Terms from './Pages/Terms';
import { useAddressStore } from './Store/addressStore';
import { useAuthStore } from './Store/authStore';
import { useNotificationStore } from './Store/notificationStore';

//import createClientLogger from './Utils/clientLogger';

//const log = createClientLogger('App.tsx');

// Lazy loaded page components
const Signup = lazy(() => import('./Pages/Signup'));
const Home = lazy(() => import('./Pages/Home'));
const Discovery = lazy(() => import('./Pages/Discovery'));
const Cart = lazy(() => import('./Pages/Cart'));
const History = lazy(() => import('./Pages/History'));
const Profile = lazy(() => import('./Pages/Profile'));
const Admin = lazy(() => import('./Pages/Admin'));
const Support = lazy(() => import('./Pages/Support'));
const Wallet = lazy(() => import('./Pages/Wallet'));
const Login = lazy(() => import('./Pages/Login')); //
function AppLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="relative flex min-h-screen w-full flex-col md:flex-row">
            {/* Sidebar/Navigation remains fixed */}
            <Navigation />

            <div className="flex min-h-screen w-full max-w-full flex-grow flex-col overflow-x-hidden pb-24 md:pb-8 md:pl-16">
                {/* Header Bar */}
                <Header />
                <NotificationDrawer />

                {/* Main Routing Canvas: Inner content swaps here */}
                <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-6 md:px-8">
                    {children ?? <Outlet />}
                </main>

                {/* Footer Component */}
                <Footer />
            </div>
        </div>
    );
}

function RootRoute() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return isAuthenticated ? (
        <AppLayout>
            <Home />
        </AppLayout>
    ) : (
        <Landing />
    );
}

export default function App() {
    const savedAddresses =
        useAddressStore((state) => state.savedAddresses) || [];
    const fetchAddress = useAddressStore((state) => state.fetchAddress);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const fetchNotifications = useNotificationStore(
        (state) => state.fetchNotifications
    );

    useEffect(() => {
        if (isAuthenticated && savedAddresses?.length === 0) {
            fetchAddress();
        }
    }, [isAuthenticated, savedAddresses.length, fetchAddress]);

    useEffect(() => {
        if (!isAuthenticated) return;
        void fetchNotifications();
    }, [isAuthenticated, fetchNotifications]);

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1, // Limit API fallback attempts on failure loops
            },
        },
    });

    return (
        <div className="text-on-surface bg-background font-inter flex min-h-screen flex-col">
            <ErrorToast />
            <InfoToast />
            <WarningToast />
            <SuccessToast />
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Suspense
                        fallback={
                            <div className="bg-background flex min-h-screen items-center justify-center">
                                <SkeletonLoader type="home" />
                            </div>
                        }
                    >
                        <Routes>
                            <Route
                                path="/legal/terms"
                                element={
                                    <>
                                        <Terms />
                                        <Footer />
                                    </>
                                }
                            />
                            <Route
                                path="/legal/privacy"
                                element={
                                    <>
                                        <Privacy />
                                        <Footer />
                                    </>
                                }
                            />
                            <Route
                                path="/legal/cookies"
                                element={
                                    <>
                                        <Cookies />
                                        <Footer />
                                    </>
                                }
                            />
                            <Route path="/auth/login" element={<Login />} />
                            <Route path="/auth/signup" element={<Signup />} />
                            <Route
                                path="/auth/2fa-setup"
                                element={<Setup2FA />}
                            />
                            <Route
                                path="/auth/verify-2fa"
                                element={<Verify2FA />}
                            />
                            <Route
                                path="/rider/activate"
                                element={<RiderActivation />}
                            />
                            <Route
                                path="/auth/reset-password"
                                element={<ResetPassword />}
                            />
                            <Route path="/" element={<RootRoute />} />
                            <Route element={<ProtectedRoutes />}>
                                <Route element={<AppLayout />}>
                                    <Route
                                        path="/discovery"
                                        element={<Discovery />}
                                    />
                                    <Route path="/cart" element={<Cart />} />
                                    <Route
                                        path="/history"
                                        element={<History />}
                                    />
                                    <Route
                                        path="/rider"
                                        element={<RiderDashboard />}
                                    />
                                    <Route path="/admin" element={<Admin />} />
                                    <Route
                                        path="/profile"
                                        element={<Profile />}
                                    />
                                    <Route
                                        path="/wallet"
                                        element={<Wallet />}
                                    />
                                    <Route
                                        path="/support"
                                        element={<Support />}
                                    />
                                </Route>
                            </Route>
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </QueryClientProvider>
        </div>
    );
}
