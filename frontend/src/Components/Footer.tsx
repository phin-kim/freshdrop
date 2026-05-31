import { GiCabbage, GiMilkCarton, GiShinyApple } from 'react-icons/gi';
import {
    MdMailOutline,
    MdOutlineBakeryDining,
    MdOutlineEco,
    MdOutlineGppGood,
    MdOutlineLocationOn,
    MdOutlinePark,
    MdOutlineSupportAgent,
    MdOutlineVolunteerActivism,
} from 'react-icons/md';

import { useStore } from '../Store/productStore';

export default function Footer() {
    const { user } = useStore();

    if (!user) return null;

    return (
        <footer
            id="website-footer"
            className="mt-16 border-t border-emerald-950 bg-[#1e251f] pt-12 pb-24 text-[#bcc7bd] md:pb-12"
        >
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-2 md:px-12 lg:grid-cols-4">
                {/* Brand & Mission column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-white">
                        <span className="material-symbols-outlined text-primary text-3xl font-extrabold text-[#7fc17f]">
                            <MdOutlineEco />
                        </span>
                        <span className="font-caveat text-3xl font-bold tracking-wide">
                            FreshDrop
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-[#a1ae9f]">
                        Direct sustainable connections to certified organic
                        farms. Bringing seasonal, hand-picked produce from deep
                        rural soils straight to your urban pantry table.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                        <span className="rounded-full border border-[#2d3a2e] bg-emerald-950/80 px-2.5 py-1 text-[10px] font-black tracking-wider text-[#98e198] uppercase">
                            ★ 100% Certified Organic
                        </span>
                        <span className="rounded-full border border-[#2d3a2e] bg-emerald-950/80 px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-300 uppercase">
                            ⚡ Farm-To-Table
                        </span>
                    </div>
                </div>

                {/* Categories Quick Links */}
                <div className="space-y-4">
                    <h4 className="border-l-2 border-[#7fc17f] pl-2.5 text-sm font-extrabold tracking-widest text-white uppercase">
                        Store Categories
                    </h4>
                    <ul className="space-y-2 text-sm font-semibold">
                        <li>
                            <a
                                href="#desktop-sidebar"
                                className="flex items-center gap-2 transition-colors duration-150 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-base">
                                    <GiCabbage />
                                </span>{' '}
                                Vegetables section
                            </a>
                        </li>
                        <li>
                            <a
                                href="#desktop-sidebar"
                                className="flex items-center gap-2 transition-colors duration-150 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-base">
                                    <GiShinyApple />
                                </span>{' '}
                                Fruits harvest
                            </a>
                        </li>
                        <li>
                            <a
                                href="#desktop-sidebar"
                                className="flex items-center gap-2 transition-colors duration-150 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-base">
                                    <GiMilkCarton />
                                </span>{' '}
                                Dairy milk & cheese
                            </a>
                        </li>
                        <li>
                            <a
                                href="#desktop-sidebar"
                                className="flex items-center gap-2 transition-colors duration-150 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-base">
                                    <MdOutlineBakeryDining />
                                </span>{' '}
                                Fresh baked bread
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Sustainable Promises / Quality Assurance Column */}
                <div className="space-y-4">
                    <h4 className="border-l-2 border-[#7fc17f] pl-2.5 text-sm font-extrabold tracking-widest text-white uppercase">
                        Sustainable Promise
                    </h4>
                    <div className="space-y-3.5 text-xs leading-relaxed text-[#a1ae9f]">
                        <div className="flex gap-2.5">
                            <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-[#7fc17f]">
                                <MdOutlinePark />
                            </span>
                            <div>
                                <strong className="block font-bold text-white">
                                    Carbon-Neutral Deliveries
                                </strong>
                                <span>
                                    All routes are computed with real-time
                                    location engines to cut carbon footprints by
                                    35%.
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-amber-400">
                                <MdOutlineVolunteerActivism />
                            </span>
                            <div>
                                <strong className="block font-bold text-white">
                                    Fair Farm Compensation
                                </strong>
                                <span>
                                    We ensure 85%+ of each transaction is
                                    directly paid to local farmers and partners.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Farm Contact & Hours */}
                <div className="space-y-4">
                    <h4 className="border-l-2 border-[#7fc17f] pl-2.5 text-sm font-extrabold tracking-widest text-white uppercase">
                        Hub Contact Info
                    </h4>
                    <div className="space-y-2.5 text-sm font-semibold">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg text-[#7fc17f]">
                                <MdOutlineSupportAgent />
                            </span>
                            <span>+254 700 123 456 (Farm Support)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg text-[#7fc17f]">
                                <MdMailOutline />
                            </span>
                            <span>support@freshdrop.co.ke</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg text-[#7fc17f]">
                                <MdOutlineLocationOn />
                            </span>
                            <span className="text-xs leading-normal">
                                Organic Central Hub, Westlands Area, Nairobi, KE
                            </span>
                        </div>
                    </div>

                    {/* Working hours indicator */}
                    <div className="mt-4 flex items-center gap-2 border-t border-emerald-950 pt-2.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7fc17f]"></span>
                        </span>
                        <span className="text-xs font-bold tracking-widest text-[#7fc17f] uppercase">
                            Store Open: 06:00 AM - 09:00 PM
                        </span>
                    </div>
                </div>
            </div>

            {/* Sub-footer area */}
            <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-[#29332a] px-6 pt-6 text-xs font-semibold text-[#809181] md:flex-row md:items-center md:justify-between md:px-12">
                <div>
                    <span>
                        © {new Date().getFullYear()} FreshDrop Organic Markets.
                        All rights reserved.
                    </span>
                    <span className="mx-2">|</span>
                    <a href="#" className="hover:text-white hover:underline">
                        Privacy Policy
                    </a>
                    <span className="mx-2">|</span>
                    <a href="#" className="hover:text-white hover:underline">
                        Merchant Terms
                    </a>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-[#232a24] bg-[#171c17] px-3 py-1.5">
                    <span className="material-symbols-outlined text-[16px] text-green-400">
                        <MdOutlineGppGood />
                    </span>
                    <span>
                        Verified Merchant: Payhero Premium Integration Enabled
                    </span>
                </div>
            </div>
        </footer>
    );
}
