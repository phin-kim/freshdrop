import { AnimatePresence, motion } from 'framer-motion';
import { Info, X } from 'lucide-react';

import { useBannerStore } from '../../Store/bannerStore';

export default function WarningBanner() {
    const { isOpen, title, message, closeBanner } = useBannerStore();

    return (
        <AnimatePresence>
            {isOpen && (
                // Backdrop that closes the banner when clicked
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
                    onClick={closeBanner}
                >
                    {/* The Banner itself */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            duration: 0.3,
                            type: 'spring',
                            damping: 25,
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        className="relative flex w-full max-w-md items-start gap-4 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 px-6 py-5 shadow-2xl sm:max-w-lg"
                    >
                        {/* Friendly Info Icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Info className="h-6 w-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5">
                            <h4 className="mb-1 text-sm font-bold tracking-wide text-blue-900 uppercase">
                                {title || 'Notice'}
                            </h4>
                            <p className="text-[15px] leading-relaxed font-medium text-blue-800">
                                {message}
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={closeBanner}
                            className="absolute top-4 right-4 rounded-lg p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-700"
                            aria-label="Close banner"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
