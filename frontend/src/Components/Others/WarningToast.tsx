import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import useWarningStore from '../../Store/warningStore';

const WarningToast = () => {
    const { warning, clearWarning } = useWarningStore();

    useEffect(() => {
        if (warning) {
            const timer = setTimeout(() => clearWarning(), 4000);
            return () => clearTimeout(timer);
        }
    }, [warning, clearWarning]);

    if (!warning) return null;

    return (
        <AnimatePresence>
            {warning && (
                <motion.div
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                    transition={{
                        duration: 0.5,
                        type: 'spring',
                        damping: 15,
                        stiffness: 300,
                    }}
                    className="fixed top-4 left-1/2 z-9999 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-center gap-4 overflow-hidden rounded-2xl border-2 border-white/20 bg-amber-600 px-5 py-4 text-white shadow-[0_20px_50px_rgba(217,119,6,0.4)] backdrop-blur-md sm:top-6 sm:right-6 sm:left-auto sm:w-auto sm:min-w-[340px] sm:translate-x-0 sm:px-6 sm:py-5"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                        <AlertTriangle className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h4 className="mb-0.5 text-xs font-black tracking-widest text-white/70 uppercase">
                            Warning
                        </h4>
                        <p className="text-[15px] leading-snug font-bold text-white">
                            {warning}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WarningToast;
