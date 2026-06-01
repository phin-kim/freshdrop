/*import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import Footer from './Components/Footer';
import Header from './Components/Header';
import Navigation from './Components/Navigation';
import ProtectedRoutes from './Components/ProtectedRoutes';
import SkeletonLoader from './Components/SkeletonLoader';



const Home = lazy(() => import('./Pages/Home'));
const Discovery = lazy(() => import('./Pages/Discovery'));
const Cart = lazy(() => import('./Pages/Cart'));
const History = lazy(() => import('./Pages/History'));
const Profile = lazy(() => import('./Pages/Profile'));
export default function App() {
    //const navigate = useNavigate();

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
                    <Routes>
                        <Route element={<ProtectedRoutes />}>
                            <div className="relative flex min-h-screen w-full flex-col md:flex-row">
                                <Navigation />

                                <div className="flex min-h-screen w-full max-w-full flex-grow flex-col overflow-x-hidden pb-24 md:pb-8 md:pl-16">
                                   
                                    <Header />

                                   
                                    <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-6 md:px-8">
                                        <Routes>
                                            <Route
                                                path="/"
                                                element={<Home />}
                                            />
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

                                    
                                    <Footer />
                                </div>
                            </div>
                        </Route>
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </div>
    );
}*/
import { Suspense, lazy } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import Footer from './Components/Footer';
import Header from './Components/Header';
import Navigation from './Components/Navigation';
import ProtectedRoutes from './Components/ProtectedRoutes';
import SkeletonLoader from './Components/SkeletonLoader';

// Lazy loaded page components
const Signup = lazy(() => import('./Pages/Signup'));
const Home = lazy(() => import('./Pages/Home'));
const Discovery = lazy(() => import('./Pages/Discovery'));
const Cart = lazy(() => import('./Pages/Cart'));
const History = lazy(() => import('./Pages/History'));
const Profile = lazy(() => import('./Pages/Profile'));
const Login = lazy(() => import('./Pages/Login')); //
function AppLayout() {
    return (
        <div className="relative flex min-h-screen w-full flex-col md:flex-row">
            {/* Sidebar/Navigation remains fixed */}
            <Navigation />

            <div className="flex min-h-screen w-full max-w-full flex-grow flex-col overflow-x-hidden pb-24 md:pb-8 md:pl-16">
                {/* Header Bar */}
                <Header />

                {/* Main Routing Canvas: Inner content swaps here */}
                <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-6 md:px-8">
                    <Outlet />
                </main>

                {/* Footer Component */}
                <Footer />
            </div>
        </div>
    );
}

export default function App() {
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
                    <Routes>
                        <Route path="/auth/login" element={<Login />} />
                        <Route path="/auth/signup" element={<Signup />} />

                        <Route element={<ProtectedRoutes />}>
                            <Route element={<AppLayout />}>
                                <Route path="/" element={<Home />} />
                                <Route
                                    path="/discovery"
                                    element={<Discovery />}
                                />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/history" element={<History />} />
                                <Route path="/profile" element={<Profile />} />
                            </Route>
                        </Route>
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </div>
    );
}
