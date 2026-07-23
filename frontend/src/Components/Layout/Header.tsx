import {
    MdNotificationsNone,
    MdOutlineEco,
    MdOutlineLocationOn,
} from 'react-icons/md';
import { useNavigate } from 'react-router';

import { useDeliveryStore } from '../../Store/delivery';

const Header = () => {
    const navigate = useNavigate();
    const deliveryLocation = useDeliveryStore(
        (state) => state.deliveryLocation
    );
    const setSearchQuery = useDeliveryStore((state) => state.setSearchQuery);
    return (
        <header className="border-outline-variant/10 sticky top-0 z-40 border-b bg-white shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl font-bold">
                        <MdOutlineLocationOn />
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
                    className="font-caveat text-primary flex cursor-pointer items-center gap-1.5 text-3xl font-bold md:text-4xl"
                    onClick={() => {
                        navigate('/home');
                        setSearchQuery('');
                    }}
                >
                    <span className="material-symbols-outlined">
                        <MdOutlineEco />
                    </span>
                    FreshDrop
                </h1>

                {/* Profile card and cart count in Header trigger */}
                <div className="flex items-center gap-2.5">
                    <button
                        // onClick={() => addToast("No new delivery alerts. All systems operational!", "info")}
                        className="hover:bg-surface-container-low relative rounded-full p-2.5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-primary text-2xl font-bold">
                            <MdNotificationsNone />
                        </span>
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-rose-500"></span>
                    </button>

                    {/*<button
                          onClick={() => setActiveTab("cart")}
                          className="relative p-2.5 rounded-full hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-primary font-bold text-2xl">shopping_cart</span>
                          {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-tertiary-container text-on-tertiary-container font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                              {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                          )}
                        </button>*/}
                </div>
            </div>
        </header>
    );
};
export default Header;
