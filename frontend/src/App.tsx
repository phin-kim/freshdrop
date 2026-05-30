import { Suspense,lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import { useStore } from './Store/productStore';


import Navigation from './Components/Navigation';
import Footer from './Components/Footer';
import CheckoutModal from './Components/CheckoutModal';
import SkeletonLoader from './Components/SkeletonLoader';
 const Home = lazy(() => import('./Pages/Home'));
 const Discovery = lazy(() => import('./Pages/Discovery'));
 const Cart = lazy(() => import('./Pages/Cart'));
 const History = lazy(() => import('./Pages/History'));
 const Profile = lazy(() => import('./Pages/Profile'));
 const Auth = lazy(() => import('./Pages/Auth'));

export default function App() {
  const navigate = useNavigate();
  const { user, cart, addToast } = useStore();
  const { deliveryLocation, showCheckoutModal, setSearchQuery } = useAppContext();

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleLogoClick = () => {
    setSearchQuery("");
    navigate("/");
  };
  return (
    <div className="min-h-screen text-on-surface bg-background flex flex-col font-inter">
      <BrowserRouter>
       <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <SkeletonLoader type="home" />
          </div>
        }
      >
        {!user ? (
          /* Guest/Unauthenticated Routing Layout */
          <Routes>
            <Route path="/auth/login" element={<Auth />} />
            <Route path="/auth/signup" element={<Auth />} />
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        ) : (
          /* Authenticated Router Layout with Side/Bottom Nav, Header, Main, and Footer */
          <div className="flex flex-col md:flex-row min-h-screen w-full relative">
            <Navigation />

            <div className="flex-grow flex flex-col min-h-screen md:pl-16 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
              {/* Header Bar */}
              <header className="bg-white sticky top-0 z-40 border-b border-outline-variant/10 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl font-bold">location_on</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold tracking-widest text-[#6B705C] uppercase">DELIVER TO</span>
                      <span id="deliver-destination-header" className="text-sm font-bold text-primary">{deliveryLocation}</span>
                    </div>
                  </div>

                  <h1
                    onClick={handleLogoClick}
                    className="font-caveat text-3xl md:text-4xl text-primary font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 select-none"
                  >
                    <span className="material-symbols-outlined">eco</span>
                    FreshDrop
                  </h1>

                  {/* Profile badge and quick triggers */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => addToast("All digital systems healthy. No new alerts!", "info")}
                      className="relative p-2.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary font-bold text-2xl">notifications</span>
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    </button>

                    <button
                      onClick={() => navigate("/cart")}
                      className="relative p-2.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary font-bold text-2xl">shopping_cart</span>
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                          {cartCount}
                        </span>
                      )}
                    </button>

                    <div
                      onClick={() => navigate("/profile")}
                      className="flex items-center gap-2 pl-3 border-l border-outline-variant/40 cursor-pointer hover:opacity-95"
                    >
                      <img
                        alt={user.name}
                        src={user.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                        className="w-9 h-9 rounded-full bg-emerald-100 border border-primary/20 object-cover"
                      />
                      <div className="hidden md:flex flex-col text-left">
                        <span className="text-xs font-bold leading-none">{user.name.split(' ')[0]}</span>
                        <span className="text-[9px] text-primary font-extrabold tracking-wide uppercase mt-0.5">Gold Member</span>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Routing Screen Canvas */}
              <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 flex-grow w-full">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/discovery" element={<Discovery />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Footer Component */}
              <Footer />

              {/* Secure Checkout Dialog Modal */}
              {showCheckoutModal && <CheckoutModal />}
            </div>
          </div>
        )}
      </Suspense>
      </BrowserRouter>
    </div>
  );
}
