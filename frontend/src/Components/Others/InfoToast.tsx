import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useEffect } from 'react';

import useInfoStore from '../../Store/infoStore';

const InfoToast = () => {
    const { info, clearInfo } = useInfoStore();

    useEffect(() => {
        if (info) {
            const timer = setTimeout(() => clearInfo(), 4000);
            return () => clearTimeout(timer);
        }
    }, [info, clearInfo]);

    if (!info) return null;

    return (
        <AnimatePresence>
            {info && (
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
                    className="fixed top-6 right-6 z-9999 flex max-w-md min-w-[340px] items-center gap-4 overflow-hidden rounded-2xl border-2 border-white/20 bg-blue-600 px-6 py-5 text-white shadow-[0_20px_50px_rgba(37,99,235,0.4)] backdrop-blur-md"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                        <Info className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h4 className="mb-0.5 text-xs font-black tracking-widest text-white/70 uppercase">
                            Information
                        </h4>
                        <p className="text-[15px] leading-snug font-bold text-white">
                            {info}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InfoToast;
