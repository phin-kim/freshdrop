import { zodResolver } from '@hookform/resolvers/zod';
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    ShieldCheck,
    Sparkles,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdOutlineEco, MdSync } from 'react-icons/md';
import { useNavigate } from 'react-router';

import { SignupInput, signupSchema } from '../../../shared/formValidator';
import { useAuthStore } from '../Store/authStore';

export default function Signup() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const signup = useAuthStore((state) => state.signup);
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = (data: SignupInput) => {
        signup(data.name, data.email, data.password);
        navigate('/');
    };

    const handleApplyDemoProfile = () => {
        setValue('name', 'Phinehas Njuguna', { shouldValidate: true });
        setValue('email', 'pantry.grower@freshdrop.com', {
            shouldValidate: true,
        });
        setValue('password', 'securegrower7', { shouldValidate: true });
    };

    return (
        <main className="flex min-h-[calc(100vh-140px)] flex-grow items-center justify-center px-4 py-8 md:p-12">
            <div className="bg-surface-container-lowest border-outline-variant/30 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border bg-white shadow-xl lg:grid-cols-2">
                {/* Visual Screen on Left */}
                <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-[#d9e6da] p-12 text-center lg:flex">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 2px 2px, #006e1c 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                        }}
                    ></div>
                    <div className="animate-fade-in relative z-10">
                        <img
                            alt="FreshDrop Organic Harvest Illustration"
                            className="mx-auto mb-8 h-auto w-full max-w-xs rounded-lg shadow-sm"
                            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                        />
                    </div>
                    <h2 className="font-caveat mb-4 text-5xl leading-tight font-bold text-[#006e1c]">
                        Fresh Pantry Registration
                    </h2>
                    <p className="font-inter mx-auto max-w-xs text-sm leading-relaxed font-medium text-[#3e4a41]">
                        Join the organic food revolution. Creating an account
                        gives you special access to local farmer harvest credits
                        and free eco-friendly downtown logistics!
                    </p>
                </div>

                {/* Auth Form and Form Inputs on Right */}
                <div className="flex flex-col justify-center p-8 lg:p-12">
                    <div className="mb-8 text-center lg:text-left">
                        <div className="mb-2 flex items-center justify-center gap-2 text-[#006e1c] lg:justify-start">
                            <span className="material-symbols-outlined text-4xl font-bold">
                                <MdOutlineEco />
                            </span>
                            <span className="font-caveat text-4xl font-bold">
                                FreshDrop
                            </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <h1 className="font-caveat text-on-surface text-[34px] font-bold">
                                Registered Account
                            </h1>

                            <button
                                type="button"
                                onClick={() => {
                                    navigate('/auth/login');
                                    reset();
                                }}
                                className="text-sm font-bold text-[#006e1c] hover:underline"
                            >
                                Login Here
                            </button>
                        </div>
                        <p className="text-outline mt-1 text-sm font-medium">
                            Create a free credentials profile to unlock organic
                            food, dairy, and local bakes.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        {/* Full Name Field */}
                        <div className="space-y-1">
                            <label className="text-on-surface-variant block text-[11px] font-bold tracking-wider uppercase">
                                Full Name
                            </label>
                            <div className="relative">
                                <span className="text-outline absolute top-1/2 left-3 -translate-y-1/2">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="e.g. Phinehas Njuguna"
                                    {...register('name')}
                                    className={`bg-surface-container-low focus:ring-primary w-full rounded-xl border py-3 pr-4 pl-10 text-[15px] transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 ${
                                        errors.name
                                            ? 'border-error focus:ring-error'
                                            : 'border-outline-variant'
                                    }`}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-error mt-1 text-xs font-semibold">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1">
                            <label className="text-on-surface-variant block text-[11px] font-bold tracking-wider uppercase">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="text-outline absolute top-1/2 left-3 -translate-y-1/2">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    placeholder="hello@freshdrop.com"
                                    {...register('email')}
                                    className={`bg-surface-container-low focus:ring-primary w-full rounded-xl border py-3 pr-4 pl-10 text-[15px] transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 ${
                                        errors.email
                                            ? 'border-error focus:ring-error'
                                            : 'border-outline-variant'
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-error mt-1 text-xs font-semibold">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1">
                            <label className="text-on-surface-variant block text-[11px] font-bold tracking-wider uppercase">
                                Password
                            </label>
                            <div className="relative">
                                <span className="text-outline absolute top-1/2 left-3 -translate-y-1/2">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min 6 characters"
                                    {...register('password')}
                                    className={`bg-surface-container-low focus:ring-primary w-full rounded-xl border py-3 pr-11 pl-10 text-[15px] transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 ${
                                        errors.password
                                            ? 'border-error focus:ring-error'
                                            : 'border-outline-variant'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="text-outline hover:text-on-surface absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-error mt-1 text-xs font-semibold">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="disabled:bg-primary/50 mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006e1c] py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#005313] active:scale-95"
                        >
                            {isSubmitting && (
                                <span className="material-symbols-outlined animate-spin text-lg">
                                    <MdSync />
                                </span>
                            )}
                            <span>Register with FreshDrop</span>
                        </button>

                        {/* Fast isSubmitting helpful button */}
                        <div className="relative flex items-center py-1">
                            <div className="border-outline-variant/50 flex-grow border-t"></div>
                            <span className="mx-3 text-[10px] font-bold tracking-widest text-[#6B705C] uppercase">
                                OR
                            </span>
                            <div className="border-outline-variant/20 flex-grow border-t"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleApplyDemoProfile}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#006e1c] py-2.5 text-xs font-bold text-[#006e1c] transition-all hover:bg-emerald-50/50 active:scale-95"
                        >
                            <Sparkles size={14} className="animate-pulse" />
                            <span>Auto-fill Registration Details</span>
                        </button>
                    </form>

                    {/* Secure Access informational block */}
                    <div className="mt-6 rounded-2xl border border-[#becab9]/30 bg-slate-50 p-4 text-left shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#006e1c] text-white">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="text-[11px] leading-relaxed font-semibold text-[#3e4a41]">
                                <span className="mb-0.5 block font-bold tracking-wider text-[#006e1c] uppercase">
                                    Data Security Assured
                                </span>
                                We adhere to standard regulatory protocols. Your
                                information remains localized and is never sold
                                to third-party services.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
