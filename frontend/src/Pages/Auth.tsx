import { FormEvent, useState } from 'react';
import {
    MdOutlineEmail,
    MdOutlineLock,
    MdOutlinePerson,
    MdOutlineVpnKey,
    MdSync,
} from 'react-icons/md';
import { z } from 'zod';

import { useStore } from '../Store/productStore';

const signUpSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' }),
});

const signInSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' }),
});

export default function LoginView() {
    const { signIn, signUp, loading, addToast } = useStore();
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authErrors, setAuthErrors] = useState<{ [key: string]: string }>({});

    const handleAutoFillDemo = () => {
        setEmail('demo@freshdrop.com');
        setPassword('123456');
        setName('Phinehas Njuguna');
        setAuthErrors({});
        addToast('Demo credentials loaded! Click login.', 'info');
    };

    const handleSignUp = (e: FormEvent) => {
        e.preventDefault();
        setAuthErrors({});
        const result = signUpSchema.safeParse({ name, email, password });
        if (!result.success) {
            const fieldErrors: { [key: string]: string } = {};
            result.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0].toString()] = err.message;
                }
            });
            setAuthErrors(fieldErrors);
            addToast('Invalid sign up form details provided.', 'error');
            return;
        }
        signUp(email, name);
    };

    const handleSignIn = (e: FormEvent) => {
        e.preventDefault();
        setAuthErrors({});
        const result = signInSchema.safeParse({ email, password });
        if (!result.success) {
            const fieldErrors: { [key: string]: string } = {};
            result.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0].toString()] = err.message;
                }
            });
            setAuthErrors(fieldErrors);
            addToast('Invalid sign in details.', 'error');
            return;
        }
        signIn(email, name || 'Valued Customer');
    };

    return (
        <main className="flex flex-grow items-center justify-center px-4 py-8 md:p-12">
            <div className="bg-surface-container-lowest border-outline-variant/30 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border shadow-xl lg:grid-cols-2">
                {/* Visual Screen on Left */}
                <div className="bg-secondary-container relative hidden flex-col items-center justify-center overflow-hidden p-12 text-center lg:flex">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 2px 2px, #006e1c 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                        }}
                    ></div>
                    <div className="class-illustration-float relative z-10">
                        <img
                            alt="FreshDrop Shopping Illustration"
                            className="mx-auto mb-8 h-auto w-full max-w-xs rounded-lg shadow-sm"
                            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                        />
                    </div>
                    <h2 className="font-caveat text-primary mb-4 text-5xl leading-tight font-bold">
                        Fresh from Local Farms
                    </h2>
                    <p className="font-inter text-on-secondary-container mx-auto max-w-xs text-sm leading-relaxed">
                        Bringing the local farmers market directly to your
                        doorstep with certified organic assurance and custom
                        smart baskets.
                    </p>
                </div>

                {/* Auth Form and Form Inputs on Right */}
                <div className="flex flex-col justify-center bg-white p-8 lg:p-12">
                    {/* Dynamic Header */}
                    <div className="mb-8 text-center lg:text-left">
                        <div className="text-primary mb-2 flex items-center justify-center gap-2 lg:justify-start">
                            <span className="material-symbols-outlined text-4xl font-bold">
                                eco
                            </span>
                            <span className="font-caveat text-primary text-4xl font-bold">
                                FreshDrop
                            </span>
                        </div>
                        <h1 className="font-caveat text-on-surface mb-2 text-[34px] font-bold">
                            {authMode === 'login'
                                ? 'Welcome Back!'
                                : 'Fresh Pantry Registration'}
                        </h1>
                        <p className="text-outline text-sm">
                            {authMode === 'login'
                                ? 'Enter your email credentials to access your local basket.'
                                : 'Sign up and explore beautiful farm-fresh deals!'}
                        </p>
                    </div>

                    {/* Form implementation */}
                    <form
                        onSubmit={
                            authMode === 'login' ? handleSignIn : handleSignUp
                        }
                        className="space-y-5"
                    >
                        {authMode === 'signup' && (
                            <div className="space-y-1">
                                <label
                                    className="text-on-surface-variant block text-[11px] font-bold tracking-wider uppercase"
                                    htmlFor="name"
                                >
                                    Full Name
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined text-outline absolute top-1/2 left-3 -translate-y-1/2 text-lg">
                                        <MdOutlinePerson />
                                    </span>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="e.g. Phinehas Njuguna"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (authErrors.name)
                                                setAuthErrors((prev) => {
                                                    const c = { ...prev };
                                                    delete c.name;
                                                    return c;
                                                });
                                        }}
                                        className={`bg-surface-container-low focus:ring-primary w-full rounded-xl border py-3 pr-4 pl-10 text-[15px] transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 ${authErrors.name ? 'border-error focus:ring-error' : 'border-outline-variant'}`}
                                    />
                                </div>
                                {authErrors.name && (
                                    <p className="text-error text-xs font-medium">
                                        {authErrors.name}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label
                                className="text-on-surface-variant block text-[11px] font-bold tracking-wider uppercase"
                                htmlFor="email"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined text-outline absolute top-1/2 left-3 -translate-y-1/2 text-lg">
                                    <MdOutlineEmail />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="hello@freshdrop.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (authErrors.email)
                                            setAuthErrors((prev) => {
                                                const c = { ...prev };
                                                delete c.email;
                                                return c;
                                            });
                                    }}
                                    className={`bg-surface-container-low focus:ring-primary w-full rounded-xl border py-3 pr-4 pl-10 text-[15px] transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 ${authErrors.email ? 'border-error focus:ring-error' : 'border-outline-variant'}`}
                                />
                            </div>
                            {authErrors.email && (
                                <p className="text-error text-xs font-medium">
                                    {authErrors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label
                                    className="text-on-surface-variant block text-[11px] font-bold tracking-wider uppercase"
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                                {authMode === 'login' && (
                                    <button
                                        type="button"
                                        className="text-primary text-xs font-bold hover:underline"
                                        onClick={() =>
                                            addToast(
                                                'Password reset link sent to simulating backend.',
                                                'info'
                                            )
                                        }
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined text-outline absolute top-1/2 left-3 -translate-y-1/2 text-lg">
                                    <MdOutlineLock />
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (authErrors.password)
                                            setAuthErrors((prev) => {
                                                const c = { ...prev };
                                                delete c.password;
                                                return c;
                                            });
                                    }}
                                    className={`bg-surface-container-low focus:ring-primary w-full rounded-xl border py-3 pr-4 pl-10 text-[15px] transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 ${authErrors.password ? 'border-error focus:ring-error' : 'border-outline-variant'}`}
                                />
                            </div>
                            {authErrors.password && (
                                <p className="text-error text-xs font-medium">
                                    {authErrors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-container disabled:bg-primary/50 mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
                        >
                            {loading && (
                                <span className="material-symbols-outlined animate-spin text-lg">
                                    <MdSync />
                                </span>
                            )}
                            {authMode === 'login'
                                ? 'Login to Pantry'
                                : 'Register with FreshDrop'}
                        </button>

                        {/* Divider panel */}
                        <div className="relative flex items-center py-2">
                            <div className="border-outline-variant/50 flex-grow border-t"></div>
                            <span className="text-outline mx-3 text-[10px] font-bold tracking-widest uppercase">
                                OR Use Sandbox
                            </span>
                            <div className="border-outline-variant/50 flex-grow border-t"></div>
                        </div>

                        {/* Sandbox credentials autofill helper */}
                        <button
                            type="button"
                            onClick={handleAutoFillDemo}
                            className="border-primary text-primary flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold transition-all hover:bg-emerald-50/50 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-base">
                                <MdOutlineVpnKey />
                            </span>
                            Auto-fill demo instructions
                        </button>
                    </form>

                    {/* Toggle Login <-> Signup */}
                    <div className="mt-8 text-center text-sm">
                        <p className="text-on-surface-variant font-medium">
                            {authMode === 'login'
                                ? "Don't have an account yet?"
                                : 'Already registered?'}
                            <button
                                onClick={() => {
                                    setAuthMode(
                                        authMode === 'login'
                                            ? 'signup'
                                            : 'login'
                                    );
                                    setAuthErrors({});
                                }}
                                className="text-primary ml-1 font-bold hover:underline"
                            >
                                {authMode === 'login'
                                    ? 'Sign Up Free'
                                    : 'Login Here'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
