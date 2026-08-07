import {
    MdNotificationsNone,
    MdOutlineEco,
    MdOutlineLocationOn,
    MdShoppingCart,
} from 'react-icons/md';
import { useNavigate } from 'react-router';

import { useAddressStore } from '../../Store/addressStore';
import { useDeliveryStore } from '../../Store/delivery';
import { useNotificationStore } from '../../Store/notificationStore';
import { useStore } from '../../Store/productStore';

const Header = () => {
    const navigate = useNavigate();

    const savedAddresses = useAddressStore((state) => state.savedAddresses);
    const deliveryDestination = useDeliveryStore(
        (state) => state.deliveryDestination
    );
    const currentAddress = useDeliveryStore((state) => state.address);
    const defaultAddress =
        savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    const deliveryLocation =
        deliveryDestination ||
        currentAddress?.deliveryDestination ||
        defaultAddress?.deliveryDestination ||
        'Select a delivery address';
    const setIsNotificationsDrawerOpen = useNotificationStore(
        (state) => state.setIsNotificationsDrawerOpen
    );
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const isNotificationsDrawerOpen = useNotificationStore(
        (state) => state.isNotificationsDrawerOpen
    );
    const cart = useStore((state) => state.cart);
    const cartCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);
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
                        onClick={() =>
                            setIsNotificationsDrawerOpen(
                                !isNotificationsDrawerOpen
                            )
                        }
                        className="hover:bg-surface-container-low relative rounded-full p-2.5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-primary text-2xl font-bold">
                            <MdNotificationsNone />
                        </span>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => navigate('/cart')}
                        className="relative rounded-full p-2.5 hover:bg-surface-container-low transition-colors"
                        type="button"
                    >
                        <span className="material-symbols-outlined text-primary text-2xl font-bold">
                            <MdShoppingCart />
                        </span>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-black leading-none shadow-lg animate-bounce">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};
export default Header;
