import { useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    ChevronRight,
    Clock,
    HelpCircle,
    History,
    Mail,
    MessageSquare,
    PhoneCall,
    Send,
    ShieldCheck,
    Sparkles,
    Sprout,
} from 'lucide-react';
import React, { useState } from 'react';

import { useUpdateTickets } from '../Hooks/useUser';
import { ticketApi } from '../Library/api';
import { useAuthStore } from '../Store/authStore';
import useErrorStore from '../Store/errorStore';
//import { TicketClass } from '../types';

import type { SupportTicket, TicketClass } from '../Types/Tickets';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';

const fetchUserTickets = async () => {
    const url = `/ticket/fetch`;
    const res = await ticketApi.get<{
        success: boolean;
        data: SupportTicket[];
    }>(url);
    return res.data.data;
};
const log = createClientLogger('Support.tsx');
export default function TabSupport() {
    const setError = useErrorStore((state) => state.setError);
    // const [tickets, setTickets] = useState<SupportTicket[]>([]); //tickets to submit
    const user = useAuthStore((state) => state.user);
    const {
        data: savedTickets = [],
        isFetching,
        error,
    } = useQuery<SupportTicket[]>({
        queryKey: ['support-tickets', user?.id],
        queryFn: () => fetchUserTickets(),
        refetchInterval: 1000 * 60 * 30, // Automatically refetches every 30 minutes
        staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
        placeholderData: (previousData: SupportTicket[] | undefined) =>
            previousData, // Keeps old list visible during background refetches
    });
    //const [savedTickets, setSavedTickets] = useState<SupportTicket[]>([]);
    const [activeTab, setActiveTab] = useState<TicketClass>('REQUEST');
    const [fullName, setFullName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
        null
    );
    const { mutate: ticketSubmission, isPending: pendingSubmission } =
        useUpdateTickets();
    const submitTicket = async (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!fullName.trim()) {
            setError('Please enter your full name');
            setIsSubmitting(false);

            return;
        }
        if (!email.trim() || !email.includes('@')) {
            setError('Please provide a valid email address');
            setIsSubmitting(false);

            return;
        }
        if (!message.trim() || message.trim().length < 10) {
            setError('Please provide a detailed message (min 10 characters)');
            setIsSubmitting(false);
            return;
        }
        const ticketId = 'TCK-' + Math.floor(1000 + Math.random() * 9000);

        ticketSubmission(
            {
                ticketId,
                message,
                fullName,
                email,
                activeTab,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setMessage('');
                },
            }
        );
    };

    // User's tickets
    const userTickets = savedTickets?.filter(
        (t: Partial<SupportTicket>) =>
            (user &&
                (t.userId === user.id ||
                    t.email?.toLowerCase() === user.email.toLowerCase())) ||
            t.email?.toLowerCase() === email.toLowerCase()
    );

    const getButtonLabel = () => {
        switch (activeTab) {
            case 'REQUEST':
                return 'SUBMIT REQUEST';
            case 'COMMENT':
                return 'SUBMIT COMMENT';
            case 'COMPLAINT':
                return 'SUBMIT COMPLAINT';
            default:
                return 'SUBMIT TICKET';
        }
    };

    const getClassBadgeStyle = (tClass: TicketClass) => {
        switch (tClass) {
            case 'REQUEST':
                return 'bg-[#4C6B36]/10 text-[#4C6B36] border-[#4C6B36]/30';
            case 'COMMENT':
                return 'bg-[#D4A373]/20 text-[#8C5D30] border-[#D4A373]/40';
            case 'COMPLAINT':
                return 'bg-[#BA1A1A]/10 text-[#BA1A1A] border-[#BA1A1A]/30';
        }
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'Resolved':
                return 'bg-[#4C6B36]/15 text-[#2d4722] border-[#4C6B36]/30';
            case 'In Review':
                return 'bg-[#6B705C]/15 text-[#4F5243] border-[#6B705C]/30';
            case 'Closed':
                return 'bg-stone-200 text-stone-700 border-stone-300';
            default:
                return 'bg-amber-100 text-amber-900 border-amber-300';
        }
    };

    const faqs = [
        {
            q: 'How fast do carbon-neutral couriers deliver my fresh produce?',
            a: 'Deliveries in Kiambu, Juja, Thika, and Nairobi metropolitan hubs arrive within 45 to 90 minutes. Electric vehicles and cargo bikes ensure zero tailpipe emissions.',
        },
        {
            q: 'What is your produce freshness guarantee policy?',
            a: "If any item arrives damaged, bruised, or unsatisfactory, simply file a 'COMPLAINT' ticket with your order details. We issue instant credits or replacement dispatches.",
        },
        {
            q: 'Can I request new organic crops or wholesale bulk quantities?',
            a: "Yes! Use the 'REQUEST' tab to request specific organic fruits, heirloom veggies, or wholesale farm crates directly from our partnered farming cooperatives.",
        },
    ];
    if (isFetching) return <div>Loading tickets...</div>;
    if (pendingSubmission) return <div>Waiting submission...</div>;
    if (error) {
        log.error('Error fetching orders', { data: { error } });
        handleApiError(error, setError);
    }

    return (
        <div className="animate-fade-in font-inter mx-auto w-full max-w-6xl space-y-10 pb-20 text-left">
            {/* Top Header Banner in FreshDrop Theme */}
            <div className="mx-auto max-w-2xl space-y-2 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E1D8] bg-[#F0EDE4] px-3.5 py-1.5 text-xs font-black tracking-wider text-[#4C6B36] uppercase">
                    <Sprout className="h-3.5 w-3.5 text-[#4C6B36]" />
                    <span>FreshDrop Customer Desk</span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-[#2D3025] sm:text-4xl">
                    Support & Issue Tickets
                </h1>

                <p className="text-sm font-medium text-[#6B705C]">
                    Have feedback, need assistance with your harvest delivery,
                    or looking for specific crops? Select an issue
                    classification below to connect directly with our dispatch
                    team.
                </p>
            </div>

            {/* MAIN "GET IN TOUCH" COMPONENT - Styled in FreshDrop Theme */}
            <div className="overflow-hidden rounded-[28px] border border-[#E5E1D8] bg-white shadow-xl">
                <div className="grid min-h-[540px] grid-cols-1 lg:grid-cols-12">
                    {/* LEFT PANEL: Rich Organic FreshDrop Green (#2D4722 / #395627) */}
                    <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#395627] via-[#2d4722] to-[#243a1a] p-8 text-white sm:p-10 lg:col-span-5">
                        {/* Ambient organic light effects */}
                        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                        <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#D4A373]/15 blur-3xl" />

                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black tracking-wider text-emerald-100 uppercase backdrop-blur-md">
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                Customer Support Desk
                            </div>

                            <h2 className="text-3xl leading-tight font-black tracking-tight text-white sm:text-4xl">
                                Get in Touch
                            </h2>

                            <p className="max-w-sm text-xs leading-relaxed font-medium text-emerald-100/90 sm:text-sm">
                                Have a question about your order, harvest
                                quality, or need technical assistance? Our
                                dedicated support team is here to help.
                            </p>
                        </div>

                        {/* Channels List */}
                        <div className="relative z-10 my-8 space-y-3.5">
                            {/* Email Support */}
                            <div className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md transition hover:bg-white/15">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 transition group-hover:scale-105">
                                    <Mail className="h-5 w-5 text-white" />
                                </div>
                                <div className="overflow-hidden">
                                    <span className="block text-[10px] font-extrabold tracking-widest text-emerald-200 uppercase">
                                        EMAIL SUPPORT
                                    </span>
                                    <a
                                        href="mailto:support@freshdrop.co.ke"
                                        className="block truncate text-xs font-bold text-white hover:underline sm:text-sm"
                                    >
                                        support@freshdrop.co.ke
                                    </a>
                                </div>
                            </div>

                            {/* Live Chat */}
                            <div className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md transition hover:bg-white/15">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 transition group-hover:scale-105">
                                    <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                                <div className="overflow-hidden">
                                    <span className="block text-[10px] font-extrabold tracking-widest text-emerald-200 uppercase">
                                        LIVE CHAT
                                    </span>
                                    <span className="block truncate text-xs font-bold text-white sm:text-sm">
                                        Available 24/7 for FreshDrop users
                                    </span>
                                </div>
                            </div>

                            {/* Phone Line */}
                            <div className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md transition hover:bg-white/15">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 transition group-hover:scale-105">
                                    <PhoneCall className="h-5 w-5 text-white" />
                                </div>
                                <div className="overflow-hidden">
                                    <span className="block text-[10px] font-extrabold tracking-widest text-emerald-200 uppercase">
                                        FARM SUPPORT LINE
                                    </span>
                                    <span className="block truncate text-xs font-bold text-white sm:text-sm">
                                        +254 700 123 456
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-2 pt-2 text-[11px] text-emerald-100/85">
                            <ShieldCheck className="h-4 w-4 text-emerald-300" />
                            <span>
                                Certified Sustainable Customer Assistance Desk
                            </span>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Clean FreshDrop Surface (#FDFCF8 / White) */}
                    <div className="flex flex-col justify-center bg-[#FDFCF8] p-8 sm:p-10 lg:col-span-7">
                        <form onSubmit={submitTicket} className="space-y-6">
                            {/* 3 Classes Segment Control */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black tracking-widest text-[#6B705C] uppercase">
                                        CLASSIFICATION
                                    </span>
                                    <span className="text-[10px] font-bold text-[#4C6B36]">
                                        Class: {activeTab}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[#E5E1D8] bg-[#F0EDE4] p-1.5 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('REQUEST')}
                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-black tracking-wider uppercase transition ${
                                            activeTab === 'REQUEST'
                                                ? 'border border-[#395627] bg-[#4C6B36] text-white shadow-md'
                                                : 'text-[#6B705C] hover:bg-white/60 hover:text-[#2D3025]'
                                        }`}
                                    >
                                        <span>REQUEST</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('COMMENT')}
                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-black tracking-wider uppercase transition ${
                                            activeTab === 'COMMENT'
                                                ? 'border border-[#395627] bg-[#4C6B36] text-white shadow-md'
                                                : 'text-[#6B705C] hover:bg-white/60 hover:text-[#2D3025]'
                                        }`}
                                    >
                                        <span>COMMENT</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveTab('COMPLAINT')
                                        }
                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-black tracking-wider uppercase transition ${
                                            activeTab === 'COMPLAINT'
                                                ? 'border border-[#395627] bg-[#4C6B36] text-white shadow-md'
                                                : 'text-[#6B705C] hover:bg-white/60 hover:text-[#2D3025]'
                                        }`}
                                    >
                                        <span>COMPLAINT</span>
                                    </button>
                                </div>
                            </div>

                            {/* Form Inputs Grid */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Full Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-black tracking-widest text-[#6B705C] uppercase">
                                        FULL NAME
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) =>
                                            setFullName(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-[#E5E1D8] bg-white px-4 py-3.5 text-sm font-medium text-[#2D3025] placeholder-[#8C877E] transition focus:border-[#4C6B36] focus:ring-2 focus:ring-[#4C6B36] focus:outline-none"
                                        required
                                    />
                                </div>

                                {/* Email Address */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-black tracking-widest text-[#6B705C] uppercase">
                                        EMAIL ADDRESS
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-[#E5E1D8] bg-white px-4 py-3.5 text-sm font-medium text-[#2D3025] placeholder-[#8C877E] transition focus:border-[#4C6B36] focus:ring-2 focus:ring-[#4C6B36] focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Message Textarea */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-black tracking-widest text-[#6B705C] uppercase">
                                        MESSAGE
                                    </label>
                                    <span className="text-[10px] text-[#8C877E]">
                                        {activeTab === 'COMPLAINT'
                                            ? 'Describe the issue or order number'
                                            : 'Tell us more about your inquiry...'}
                                    </span>
                                </div>
                                <textarea
                                    rows={4}
                                    placeholder="Tell us more about your inquiry..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full resize-none rounded-xl border border-[#E5E1D8] bg-white px-4 py-3.5 text-sm leading-relaxed font-medium text-[#2D3025] placeholder-[#8C877E] transition focus:border-[#4C6B36] focus:ring-2 focus:ring-[#4C6B36] focus:outline-none"
                                    required
                                />
                            </div>

                            {/* Submit Button in FreshDrop Primary Theme */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-[#4C6B36] px-6 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-[#4C6B36]/25 transition-all hover:scale-[1.01] hover:bg-[#3d572b] hover:shadow-xl active:scale-[0.99] active:bg-[#344b24] disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                <span>
                                    {isSubmitting
                                        ? 'PROCESSING...'
                                        : getButtonLabel()}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION: USER'S TICKET HISTORY & FAQs */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* User's Submitted Tickets */}
                <div className="space-y-4 rounded-2xl border border-[#E5E1D8] bg-white p-6 shadow-sm sm:p-7 lg:col-span-7">
                    <div className="flex items-center justify-between border-b border-[#E5E1D8]/60 pb-3">
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-black text-[#2D3025]">
                                <History className="h-5 w-5 text-[#4C6B36]" />
                                Your Support Tickets
                            </h3>
                            <p className="mt-0.5 text-xs text-[#6B705C]">
                                Real-time tracking of submitted inquiries and
                                responses
                            </p>
                        </div>
                        <span className="rounded-full border border-[#E5E1D8] bg-[#F0EDE4] px-3 py-1 text-xs font-bold text-[#4C6B36]">
                            {userTickets.length} logged
                        </span>
                    </div>

                    {userTickets.length === 0 ? (
                        <div className="space-y-2 py-12 text-center text-[#8C877E]">
                            <HelpCircle className="mx-auto h-10 w-10 text-[#8C877E]/60" />
                            <p className="text-xs font-medium text-[#6B705C]">
                                No support tickets found for your account.
                            </p>
                            <p className="text-[11px] text-[#8C877E]">
                                Use the form above to log a request, comment, or
                                complaint.
                            </p>
                        </div>
                    ) : (
                        <div className="custom-scrollbar max-h-[420px] space-y-3 overflow-y-auto pr-1">
                            {userTickets.map((t) => {
                                const isExpanded =
                                    selectedTicketId === t.ticketId;
                                return (
                                    <div
                                        key={t.ticketId}
                                        onClick={() =>
                                            setSelectedTicketId(
                                                isExpanded ? null : t.ticketId
                                            )
                                        }
                                        className={`cursor-pointer rounded-xl border p-4 transition ${
                                            isExpanded
                                                ? 'border-[#4C6B36]/50 bg-[#F5F2EA] ring-1 ring-[#4C6B36]/20'
                                                : 'border-[#E5E1D8] bg-[#FDFCF8] hover:border-[#4C6B36]/30 hover:bg-[#F5F2EA]/60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded border border-[#E5E1D8] bg-[#F0EDE4] px-2 py-0.5 font-mono text-xs font-bold text-[#4C6B36]">
                                                    #{t.ticketId}
                                                </span>
                                                <span
                                                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${getClassBadgeStyle(t.ticketClass)}`}
                                                >
                                                    {t.ticketClass}
                                                </span>
                                            </div>
                                            <span
                                                className={`rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadgeStyle(t.status)}`}
                                            >
                                                {t.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 line-clamp-2 text-xs font-medium text-[#2D3025]">
                                            {t.message}
                                        </p>

                                        <div className="mt-3 flex items-center justify-between border-t border-[#E5E1D8]/60 pt-2.5 text-[11px] text-[#6B705C]">
                                            <span>
                                                {new Date(
                                                    t.createdAt
                                                ).toLocaleDateString()}{' '}
                                                at{' '}
                                                {new Date(
                                                    t.createdAt
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-[#4C6B36]">
                                                {isExpanded
                                                    ? 'Hide Details'
                                                    : 'View Full Details'}
                                                <ChevronRight
                                                    className={`h-3.5 w-3.5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                />
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div className="animate-fade-in mt-3 space-y-2.5 border-t border-[#E5E1D8] pt-3 text-left">
                                                <div className="rounded-lg border border-[#E5E1D8] bg-white p-3">
                                                    <span className="block text-[10px] font-bold tracking-wider text-[#8C877E] uppercase">
                                                        Submitted Inquiry
                                                    </span>
                                                    <p className="mt-1 text-xs whitespace-pre-wrap text-[#2D3025]">
                                                        {t.message}
                                                    </p>
                                                </div>

                                                {t.ticketResponse ? (
                                                    <div className="space-y-1 rounded-lg border border-[#4C6B36]/30 bg-[#F0EDE4] p-3.5">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-[#4C6B36] uppercase">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-[#4C6B36]" />
                                                            Customer Desk
                                                            Resolution
                                                        </div>
                                                        <p className="text-xs leading-relaxed font-medium text-[#2D3025]">
                                                            {t.ticketResponse}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                                                        <Clock className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                                                        <span>
                                                            Ticket is pending
                                                            review by our Juja
                                                            Hub dispatch
                                                            officer.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FAQs Column */}
                <div className="space-y-4 rounded-2xl border border-[#E5E1D8] bg-white p-6 shadow-sm sm:p-7 lg:col-span-5">
                    <div className="border-b border-[#E5E1D8]/60 pb-3">
                        <h3 className="flex items-center gap-2 text-lg font-black text-[#2D3025]">
                            <HelpCircle className="h-5 w-5 text-[#4C6B36]" />
                            Frequently Asked Questions
                        </h3>
                        <p className="mt-0.5 text-xs text-[#6B705C]">
                            Quick answers about orders, delivery, and organic
                            produce
                        </p>
                    </div>

                    <div className="space-y-3.5">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="space-y-1.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3.5"
                            >
                                <h4 className="flex items-start gap-2 text-xs font-bold text-[#2D3025]">
                                    <span className="font-black text-[#4C6B36]">
                                        Q.
                                    </span>
                                    {faq.q}
                                </h4>
                                <p className="pl-4 text-xs leading-relaxed text-[#6B705C]">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-[#4C6B36]/20 bg-[#F0EDE4] p-4">
                        <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#2D3025]">
                            <ShieldCheck className="h-4 w-4 text-[#4C6B36]" />
                            Payhero Escrow Protection
                        </h4>
                        <p className="mt-1 text-[11px] leading-snug text-[#6B705C]">
                            All M-PESA and card payments are protected under
                            satisfaction warranties. Refunds for quality
                            complaints are processed seamlessly to your original
                            phone or card.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
