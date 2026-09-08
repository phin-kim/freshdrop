import { motion } from 'framer-motion';
import {
    ArrowRight,
    Check,
    Clock3,
    Leaf,
    MapPin,
    ShoppingBasket,
    Smartphone,
    Truck,
} from 'lucide-react';
import { Link } from 'react-router';

const produceImage =
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=85&w=1400';
const marketImage =
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=85&w=1200';

const steps = [
    {
        number: '01',
        icon: MapPin,
        title: 'Choose your address',
        text: 'Tell us where to deliver and we will find the FreshDrop hubs serving your area.',
    },
    {
        number: '02',
        icon: ShoppingBasket,
        title: 'Fill your basket',
        text: 'Browse produce and everyday essentials from trusted supermarkets and local markets.',
    },
    {
        number: '03',
        icon: Truck,
        title: 'Receive the good stuff',
        text: 'Track your order from selection to doorstep, with clear updates along the way.',
    },
];

export default function Landing() {
    return (
        <div className="min-h-screen overflow-hidden bg-[#f8f7f1] text-[#24311f]">
            <header className="relative z-20 border-b border-[#dfe6d9]/70 bg-[#f8f7f1]/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-[#466d35]"
                    >
                        <Leaf className="h-7 w-7 fill-[#b9d69a]" />
                        <span className="font-caveat text-4xl leading-none font-bold">
                            FreshDrop
                        </span>
                    </Link>
                    <nav className="flex items-center gap-3 text-sm font-bold">
                        <Link
                            to="/auth/login"
                            className="hidden px-3 py-2 text-[#466d35] hover:text-[#27451e] sm:inline-block"
                        >
                            Sign in
                        </Link>
                        <Link
                            to="/auth/signup"
                            className="rounded-full bg-[#466d35] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#315326]"
                        >
                            Get started
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-12 pb-20 md:px-10 md:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pb-28">
                    <div className="relative z-10 max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55 }}
                        >
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c8dabb] bg-white/70 px-3.5 py-2 text-[11px] font-black tracking-[0.16em] text-[#466d35] uppercase">
                                <span className="h-2 w-2 rounded-full bg-[#e6a93a]" />
                                A better way to shop local
                            </div>
                            <h1 className="font-caveat text-6xl leading-[0.9] font-bold tracking-tight text-[#294722] md:text-8xl">
                                Your everyday market, delivered fresh.
                            </h1>
                            <p className="mt-7 max-w-lg text-base leading-7 font-medium text-[#63715d] md:text-lg">
                                FreshDrop brings supermarkets and local markets
                                closer to your kitchen. Build a basket in
                                minutes, discover what is available nearby, and
                                get it delivered without the Saturday queue.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Link
                                    to="/auth/signup"
                                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#e7a52f] px-7 py-4 text-sm font-black text-[#26331f] shadow-[0_10px_24px_rgba(231,165,47,0.22)] transition hover:-translate-y-0.5 hover:bg-[#f0b341]"
                                >
                                    Start your basket
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <Link
                                    to="/auth/login"
                                    className="inline-flex items-center justify-center rounded-full px-5 py-4 text-sm font-bold text-[#466d35] hover:bg-white"
                                >
                                    I already have an account
                                </Link>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-[#6d7b68]">
                                <span className="inline-flex items-center gap-2">
                                    <Check className="h-4 w-4 text-[#4c8237]" />{' '}
                                    Local market selection
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Check className="h-4 w-4 text-[#4c8237]" />{' '}
                                    Clear delivery fees
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, rotate: 1 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="relative mx-auto w-full max-w-2xl"
                    >
                        <div className="absolute -top-8 -right-4 h-28 w-28 rounded-full bg-[#e7a52f]/70 blur-2xl" />
                        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-[#b8d99a]/80 blur-3xl" />
                        <div className="relative overflow-hidden rounded-[2rem] border-[10px] border-white bg-white shadow-[0_24px_60px_rgba(61,83,49,0.18)]">
                            <img
                                src={produceImage}
                                alt="Colourful fresh produce arranged for delivery"
                                className="aspect-[1.15/1] w-full object-cover"
                            />
                            <div className="absolute right-5 bottom-5 left-5 flex items-center justify-between rounded-2xl border border-white/50 bg-[#fdfcf8]/90 px-4 py-3 shadow-lg backdrop-blur-md">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-[#7b8774] uppercase">
                                        Today in your basket
                                    </p>
                                    <p className="mt-1 text-sm font-black text-[#294722]">
                                        Colour, crunch, and something for
                                        everyone.
                                    </p>
                                </div>
                                <div className="hidden rounded-full bg-[#dcebd2] p-2 text-[#466d35] sm:block">
                                    <ShoppingBasket className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                <section className="border-y border-[#dfe6d9] bg-[#eaf0e3]">
                    <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3 md:px-10">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white p-3 text-[#466d35] shadow-sm">
                                <Clock3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-black text-[#294722]">
                                    Built for busy days
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[#687763]">
                                    Spend less time navigating aisles and more
                                    time getting on with your day.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white p-3 text-[#466d35] shadow-sm">
                                <Leaf className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-black text-[#294722]">
                                    Local when it matters
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[#687763]">
                                    A thoughtful mix of supermarket staples and
                                    produce from nearby markets.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white p-3 text-[#466d35] shadow-sm">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-black text-[#294722]">
                                    Simple from start to finish
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[#687763]">
                                    One account for your basket, address,
                                    delivery updates, and order history.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
                    <div className="grid items-end gap-8 md:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <p className="text-xs font-black tracking-[0.18em] text-[#bf8120] uppercase">
                                The FreshDrop rhythm
                            </p>
                            <h2 className="font-caveat mt-3 text-5xl leading-none font-bold text-[#294722] md:text-6xl">
                                Market day, made lighter.
                            </h2>
                        </div>
                        <p className="max-w-xl text-base leading-7 text-[#687763] md:justify-self-end">
                            From the first address pin to the final delivery
                            update, FreshDrop keeps the useful parts close and
                            the friction out of the way.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-5 md:grid-cols-3">
                        {steps.map(({ number, icon: Icon, title, text }) => (
                            <div
                                key={number}
                                className="relative border-t-2 border-[#b9d69a] bg-white p-6 shadow-[0_12px_30px_rgba(61,83,49,0.06)]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black tracking-widest text-[#bf8120]">
                                        {number}
                                    </span>
                                    <Icon className="h-5 w-5 text-[#466d35]" />
                                </div>
                                <h3 className="mt-12 text-xl font-black text-[#294722]">
                                    {title}
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-[#687763]">
                                    {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-6 mb-16 overflow-hidden rounded-[2rem] bg-[#294722] md:mx-auto md:max-w-7xl">
                    <div className="grid items-center gap-8 md:grid-cols-[1fr_0.8fr]">
                        <div className="px-7 py-12 md:px-14 md:py-16">
                            <p className="text-xs font-black tracking-[0.18em] text-[#e7c36c] uppercase">
                                Your next good decision
                            </p>
                            <h2 className="font-caveat mt-4 text-5xl leading-none font-bold text-white md:text-6xl">
                                Let&apos;s fill your basket.
                            </h2>
                            <p className="mt-5 max-w-md text-sm leading-7 text-[#d8e5d0]">
                                Create your free FreshDrop account and make your
                                first delivery feel wonderfully uncomplicated.
                            </p>
                            <Link
                                to="/auth/signup"
                                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-black text-[#294722] transition hover:bg-[#f3e8bf]"
                            >
                                Create an account{' '}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <img
                            src={marketImage}
                            alt="Fresh produce at a local market"
                            className="h-full min-h-64 w-full object-cover md:min-h-80"
                        />
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#dfe6d9] bg-[#f8f7f1]">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-[#687763] md:flex-row md:items-center md:justify-between md:px-10">
                    <p className="font-caveat text-3xl font-bold text-[#466d35]">
                        FreshDrop
                    </p>
                    <div className="flex flex-wrap gap-5 font-semibold">
                        <Link
                            to="/legal/terms"
                            className="hover:text-[#294722]"
                        >
                            Terms
                        </Link>
                        <Link
                            to="/legal/privacy"
                            className="hover:text-[#294722]"
                        >
                            Privacy
                        </Link>
                        <Link
                            to="/legal/cookies"
                            className="hover:text-[#294722]"
                        >
                            Cookies
                        </Link>
                        <Link to="/auth/login" className="hover:text-[#294722]">
                            Sign in
                        </Link>
                    </div>
                    <p className="text-xs">
                        © {new Date().getFullYear()} FreshDrop
                    </p>
                </div>
            </footer>
        </div>
    );
}
