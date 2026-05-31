import { useState } from 'react';
import {
    MdHelpOutline,
    MdOutlineChevronRight,
    MdOutlineCreditCard,
    MdOutlineLocationOn,
    MdOutlineModeEdit,
    MdOutlinePerson,
    MdOutlineShoppingBag,
    MdOutlineWarning,
} from 'react-icons/md';
import { useNavigate } from 'react-router';

import { useStore } from '../Store/productStore';

export default function Profile() {
    const navigate = useNavigate();
    const { user, setUser, signOut, addToast } = useStore();

    const [nameInput, setNameInput] = useState(user?.name || '');
    const [emailInput, setEmailInput] = useState(user?.email || '');
    const [isSaving, setIsSaving] = useState(false);

    if (!user) {
        return (
            <div className="py-12 text-center">
                <p className="text-on-surface-variant font-bold">
                    Please sign in to view your profile.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-primary mt-4 rounded-xl px-5 py-2.5 text-xs font-black text-white uppercase"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    const handleSaveChanges = () => {
        if (!nameInput.trim() || !emailInput.trim()) {
            addToast('Full Name and Email and cannot be blank.', 'error');
            return;
        }
        setIsSaving(true);
        setTimeout(() => {
            setUser({
                ...user,
                name: nameInput,
                email: emailInput,
            });
            setIsSaving(false);
            addToast('Profile credentials updated successfully!', 'success');
        }, 600);
    };

    const handleDeleteAccount = () => {
        const confirm = window.confirm(
            'Are you absolutely sure you want to delete your FreshDrop account? All active harvest credits and orders will be irreversibly deleted.'
        );
        if (confirm) {
            addToast('Account has been permanently deleted.', 'info');
            signOut();
            navigate('/');
        }
    };

    return (
        <div className="animate-fade-in mx-auto max-w-4xl space-y-8 pb-12">
            {/* Profile Header Card */}
            <section className="border-outline-variant/20 relative flex flex-col items-center overflow-hidden rounded-2xl border bg-white py-8 shadow-sm">
                {/* Decorative background image */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 opacity-10">
                    <img
                        alt="Decorative illustration"
                        className="h-full w-full object-contain"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv5Z2qP1uwzBR51qh2Q3vHpUfhD2rRvgaBTzv3_weIGiMqOVXmX50q3wMeY6_FeAbrH2LRENF-gj2jx8G2NdwEwb45Qf4eqkT1rFp3gL3gPz7Ixj3_YybUthoJVXkOPv_02zwxQTcNrxrq4oVOeb50MYwxvXuph3_8cFXp-qwyY9XujDyowlcFsuOpwVS1ip5C1eVhuiztU81lc2SHkm-ZwW_GrMiSvwIfJWklX3Oo1O308TcAjlpOcwyFoEphwrfYc0acOQvmPg"
                    />
                </div>

                <div className="group relative">
                    <div className="border-secondary-container h-32 w-32 rounded-full border-4 bg-white p-1 md:h-36 md:w-36">
                        <img
                            className="h-full w-full rounded-full object-cover"
                            alt="Portrait"
                            src={
                                user.avatar ||
                                'https://api.dicebear.com/7.x/adventurer/svg?seed=user'
                            }
                        />
                    </div>
                    <button
                        onClick={() =>
                            addToast(
                                'Custom avatar upload coming soon with cloud storage integration!',
                                'info'
                            )
                        }
                        className="bg-primary text-on-primary absolute right-1 bottom-1 cursor-pointer rounded-full border-2 border-white p-2 shadow-lg transition-transform hover:scale-105"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            <MdOutlineModeEdit />
                        </span>
                    </button>
                </div>

                <div className="mt-4 space-y-1 text-center">
                    <h2 className="font-caveat text-on-surface text-4xl leading-none font-black">
                        {user.name}
                    </h2>
                    <p className="text-primary inline-block rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                        FreshDrop Gold Member
                    </p>
                </div>
            </section>

            {/* Personal Info Form */}
            <section className="border-outline-variant/15 space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-on-surface flex items-center gap-2 border-b border-slate-50 pb-3 font-sans text-[17px] font-bold">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                        <MdOutlinePerson />
                    </span>
                    Personal Information
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5 text-left text-xs">
                        <label className="block font-extrabold tracking-widest text-[#6B705C] uppercase">
                            FULL NAME
                        </label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="bg-surface-container-low border-outline-variant focus:ring-primary w-full rounded-xl border p-3 font-semibold transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                        />
                    </div>

                    <div className="space-y-1.5 text-left text-xs">
                        <label className="block font-extrabold tracking-widest text-[#6B705C] uppercase">
                            EMAIL ADDRESS
                        </label>
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="bg-surface-container-low border-outline-variant focus:ring-primary w-full rounded-xl border p-3 font-semibold transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-primary cursor-pointer rounded-xl px-8 py-3 text-sm font-bold tracking-wide text-white shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#005313] hover:shadow disabled:bg-emerald-800/40"
                    >
                        {isSaving ? 'Saving Settings...' : 'Save Changes'}
                    </button>
                </div>
            </section>

            {/* Navigation Options List */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                    onClick={() => navigate('/history')}
                    className="border-outline-variant/15 hover:border-primary/40 group flex cursor-pointer items-center justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:bg-[#f1f3ff]/40"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-secondary-container/60 flex h-10 w-10 items-center justify-center rounded-full">
                            <span className="material-symbols-outlined text-primary text-xl">
                                <MdOutlineShoppingBag />
                            </span>
                        </div>
                        <div>
                            <span className="text-on-surface block text-sm leading-none font-bold">
                                My Orders
                            </span>
                            <span className="text-outline mt-1 block text-[10px] font-semibold">
                                Review historical transactions
                            </span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1">
                        <MdOutlineChevronRight />
                    </span>
                </button>

                <button
                    onClick={() =>
                        addToast(
                            'Your Downtown address is saved as default! Add option coming soon.',
                            'info'
                        )
                    }
                    className="border-outline-variant/15 hover:border-primary/40 group flex cursor-pointer items-center justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:bg-[#f1f3ff]/40"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-secondary-container/60 flex h-10 w-10 items-center justify-center rounded-full">
                            <span className="material-symbols-outlined text-primary text-xl">
                                <MdOutlineLocationOn />
                            </span>
                        </div>
                        <div>
                            <span className="text-on-surface block text-sm leading-none font-bold">
                                Saved Addresses
                            </span>
                            <span className="text-outline mt-1 block text-[10px] font-semibold">
                                Edit delivery destinations
                            </span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1">
                        <MdOutlineChevronRight />
                    </span>
                </button>

                <button
                    onClick={() =>
                        addToast(
                            'Secured through Payhero! You can manage cards at checkout.',
                            'info'
                        )
                    }
                    className="border-outline-variant/15 hover:border-primary/40 group flex cursor-pointer items-center justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:bg-[#f1f3ff]/40"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-secondary-container/60 flex h-10 w-10 items-center justify-center rounded-full">
                            <span className="material-symbols-outlined text-primary text-xl">
                                <MdOutlineCreditCard />
                            </span>
                        </div>
                        <div>
                            <span className="text-on-surface block text-sm leading-none font-bold">
                                Payment Methods
                            </span>
                            <span className="text-outline mt-1 block text-[10px] font-semibold">
                                Manage saved credit and M-PESA channels
                            </span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1">
                        <MdOutlineChevronRight />
                    </span>
                </button>

                <button
                    onClick={() =>
                        addToast(
                            'Support chat is online! Contact us at support@freshdrop.com.',
                            'info'
                        )
                    }
                    className="border-outline-variant/15 hover:border-primary/40 group flex cursor-pointer items-center justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:bg-[#f1f3ff]/40"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-secondary-container/60 flex h-10 w-10 items-center justify-center rounded-full">
                            <span className="material-symbols-outlined text-primary text-xl">
                                <MdHelpOutline />
                            </span>
                        </div>
                        <div>
                            <span className="text-on-surface block text-sm leading-none font-bold">
                                Help Center
                            </span>
                            <span className="text-outline mt-1 block text-[10px] font-semibold">
                                24/7 sustainable farmers customer desk
                            </span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1">
                        <MdOutlineChevronRight />
                    </span>
                </button>
            </section>

            {/* Brand logo illustration banner */}
            <section className="border-outline-variant/15 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row">
                <div className="space-y-1.5 text-center md:text-left">
                    <h4 className="font-caveat text-primary text-3xl font-black">
                        Managing your harvest, simply.
                    </h4>
                    <p className="text-on-surface-variant max-w-sm text-xs">
                        Thank you for buying organic. 80% of all commissions go
                        directly back to small scale farmers and kiosks!
                    </p>
                </div>
                <div className="pointer-events-none h-auto w-32 shrink-0 self-center opacity-80">
                    <img
                        alt="Sustainable harvest crop"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv5Z2qP1uwzBR51qh2Q3vHpUfhD2rRvgaBTzv3_weIGiMqOVXmX50q3wMeY6_FeAbrH2LRENF-gj2jx8G2NdwEwb45Qf4eqkT1rFp3gL3gPz7Ixj3_YybUthoJVXkOPv_02zwxQTcNrxrq4oVOeb50MYwxvXuph3_8cFXp-qwyY9XujDyowlcFsuOpwVS1ip5C1eVhuiztU81lc2SHkm-ZwW_GrMiSvwIfJWklX3Oo1O308TcAjlpOcwyFoEphwrfYc0acOQvmPg"
                        className="h-auto w-full object-contain"
                    />
                </div>
            </section>

            {/* Danger Zone Section */}
            <section className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-left">
                <div className="text-rose-850 flex items-center gap-2">
                    <span
                        className="material-symbols-outlined font-bold text-rose-600"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        <MdOutlineWarning />
                    </span>
                    <h3 className="font-sans text-sm font-black tracking-wider uppercase">
                        Danger Zone
                    </h3>
                </div>
                <p className="text-xs leading-relaxed font-semibold text-rose-900/80">
                    Permanently delete your FreshDrop account and all associated
                    storage data. This action is irreversible. All rewards
                    credits will be terminated.
                </p>
                <button
                    onClick={handleDeleteAccount}
                    className="bg-error w-full cursor-pointer rounded-xl px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-rose-800 active:scale-95 md:w-auto"
                >
                    Delete Account
                </button>
            </section>
        </div>
    );
}
