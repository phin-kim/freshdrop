import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    CheckCircle,
    CheckCircle2,
    Clock,
    Eye,
    HelpCircle,
    Inbox,
    Mail,
    MessageSquare,
    RefreshCw,
    Search,
    ShieldAlert,
    Sparkles,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';

import {
    useDeleteSupportTicket,
    useUpdateTicket,
} from '../../../Hooks/adminSynchronization';
import { adminAPI } from '../../../Library/api';
import useErrorStore from '../../../Store/errorStore';
//import { SupportTicket, TicketClass, TicketStatus } from '../../types';
import type {
    SupportTicket,
    TicketClass,
    TicketStatus,
} from '../../../Types/Tickets';
import handleApiError from '../../../Utils/apiError';
import createClientLogger from '../../../Utils/clientLogger';

const log = createClientLogger('AdminTickets.tsx');

export default function AdminTickets() {
    //const { updateTicketStatus, deleteTicket } = useStore();
    const [nextStatus, setNextStatus] = useState<TicketStatus>('PENDING');
    const [replyText, setReplyText] = useState('');

    const {
        data: tickets = {
            totalInquiries: 0,
            requests: 0,
            comments: 0,
            complaints: 0,
            pendingReviews: 0,
            ticketData: [],
        },
        isError,
        error,
        isPending: fetchPending,
    } = useQuery({
        queryKey: ['admin-tickets', nextStatus, replyText],
        queryFn: async () => {
            const res = await adminAPI.get('/admin/tickets/all');
            return res.data.tickets;
        },
        staleTime: 1000 * 60 * 30,
    });
    log.debug('This are the tickets', { data: tickets });
    const { mutate: updateTicket, isPending: updatePending } =
        useUpdateTicket();
    const { mutate: deleteTicket, isPending: deletePending } =
        useDeleteSupportTicket();

    const setError = useErrorStore((state) => state.setError);

    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState<'ALL' | TicketClass>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>(
        'ALL'
    );

    // Selected ticket for modal details & response
    const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(
        null
    );
    if (isError) {
        handleApiError(error, setError);
    }
    if (fetchPending) {
        return (
            <div className="flex h-96 items-center justify-center font-bold text-gray-500">
                Loading tickets..
            </div>
        );
    }
    const ticketList = Array.isArray(tickets)
        ? tickets
        : Array.isArray(tickets?.ticketData)
          ? tickets.ticketData
          : [];
    const filteredTickets = ticketList.filter((t: SupportTicket) => {
        const matchesSearch =
            t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.message.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClass =
            classFilter === 'ALL' || t.ticketClass === classFilter;
        const matchesStatus =
            statusFilter === 'ALL' || t.status === statusFilter;

        return matchesSearch && matchesClass && matchesStatus;
    });

    // Metrics
    const totalCount = tickets.totalInquiries;
    const requestsCount = tickets.requests;
    const commentsCount = tickets.comments;
    const complaintsCount = tickets.complaints;
    const pendingCount = tickets.pendingReviews;

    const handleOpenTicket = (ticket: SupportTicket) => {
        setViewingTicket(ticket);
        setReplyText(ticket.ticketResponse || '');
        setNextStatus(ticket.status === 'PENDING' ? 'PENDING' : ticket.status);
    };
    const handleDeleteTicket = (id: string) => {
        deleteTicket({
            id,
        });
    };
    const handleSaveResolution = () => {
        if (!viewingTicket) return;

        updateTicket(
            {
                id: viewingTicket.id || '',
                status: nextStatus,
                adminResponse: replyText.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setViewingTicket(null);
                    setReplyText('');
                },
            }
        );
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

    const getStatusBadgeStyle = (status: TicketStatus) => {
        switch (status) {
            case 'RESOLVED':
                return 'bg-[#4C6B36]/15 text-[#2d4722] border-[#4C6B36]/30';
            case 'PENDING':
                return 'bg-[#6B705C]/15 text-[#4F5243] border-[#6B705C]/30';
            case 'CLOSED':
                return 'bg-stone-200 text-stone-700 border-stone-300';
            default:
                return 'bg-amber-100 text-amber-900 border-amber-300';
        }
    };

    return (
        <div className="font-inter space-y-6 text-left">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
                {/* Total */}
                <div className="space-y-1 rounded-2xl border border-[#E5E1D8] bg-white p-4 shadow-sm">
                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                        Total Inquiries
                    </span>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-[#2D3025]">
                            {totalCount}
                        </span>
                        <Inbox className="h-4 w-4 text-[#8C877E]" />
                    </div>
                </div>

                {/* Requests */}
                <div className="space-y-1 rounded-2xl border border-[#E5E1D8] bg-white p-4 shadow-sm">
                    <span className="block text-[10px] font-bold tracking-wider text-[#4C6B36] uppercase">
                        Requests
                    </span>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-[#4C6B36]">
                            {requestsCount}
                        </span>
                        <Sparkles className="h-4 w-4 text-[#4C6B36]" />
                    </div>
                </div>

                {/* Comments */}
                <div className="space-y-1 rounded-2xl border border-[#E5E1D8] bg-white p-4 shadow-sm">
                    <span className="block text-[10px] font-bold tracking-wider text-[#8C5D30] uppercase">
                        Comments
                    </span>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-[#8C5D30]">
                            {commentsCount}
                        </span>
                        <MessageSquare className="h-4 w-4 text-[#D4A373]" />
                    </div>
                </div>

                {/* Complaints */}
                <div className="space-y-1 rounded-2xl border border-[#E5E1D8] bg-white p-4 shadow-sm">
                    <span className="block text-[10px] font-bold tracking-wider text-[#BA1A1A] uppercase">
                        Complaints
                    </span>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-[#BA1A1A]">
                            {complaintsCount}
                        </span>
                        <ShieldAlert className="h-4 w-4 text-[#BA1A1A]" />
                    </div>
                </div>

                {/* Pending Action */}
                <div className="col-span-2 space-y-1 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm sm:col-span-1">
                    <span className="block text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                        Pending Review
                    </span>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-amber-900">
                            {pendingCount}
                        </span>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-3 rounded-2xl border border-[#E5E1D8] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    {/* Search Box */}
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8C877E]" />
                        <input
                            type="text"
                            placeholder="Search by Ticket ID, Customer Name, Email, or Keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-[#E5E1D8] bg-[#FDFCF8] py-2 pr-3.5 pl-9 text-xs text-[#2D3025] placeholder-[#8C877E] transition focus:border-[#4C6B36] focus:ring-2 focus:ring-[#4C6B36]/30 focus:outline-none"
                        />
                    </div>

                    {/* Classification Filter Tabs */}
                    <div className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl bg-[#F0EDE4] p-1">
                        {(
                            ['ALL', 'REQUEST', 'COMMENT', 'COMPLAINT'] as const
                        ).map((cls) => (
                            <button
                                key={cls}
                                onClick={() => setClassFilter(cls)}
                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-black tracking-wider uppercase transition ${
                                    classFilter === cls
                                        ? 'bg-[#4C6B36] text-white shadow-xs'
                                        : 'text-[#6B705C] hover:text-[#2D3025]'
                                }`}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="flex shrink-0 items-center gap-1.5 text-xs">
                        <span className="text-[10px] font-bold text-[#6B705C] uppercase">
                            Status:
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as TicketStatus)
                            }
                            className="rounded-lg border border-[#E5E1D8] bg-[#FDFCF8] px-2.5 py-1.5 text-xs font-semibold text-[#2D3025] focus:outline-none"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="OPEN">Open</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tickets List */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5E1D8] bg-[#F0EDE4]/60 p-4">
                    <span className="text-xs font-bold text-[#2D3025]">
                        Showing {filteredTickets.length} of {ticketList.length}{' '}
                        Tickets
                    </span>
                    <span className="text-[11px] text-[#6B705C]">
                        Click any ticket to inspect or post a resolution
                        response
                    </span>
                </div>

                {filteredTickets.length === 0 ? (
                    <div className="space-y-2 py-16 text-center text-[#8C877E]">
                        <HelpCircle className="mx-auto h-10 w-10 text-[#8C877E]/50" />
                        <p className="text-sm font-bold text-[#2D3025]">
                            No support tickets matched your search criteria.
                        </p>
                        <p className="text-xs text-[#6B705C]">
                            Try changing classification or status filters.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#E5E1D8]/60">
                        {filteredTickets.map((t: SupportTicket) => (
                            <div
                                key={t.id}
                                onClick={() => handleOpenTicket(t)}
                                className="flex cursor-pointer flex-col justify-between gap-4 p-4 transition hover:bg-[#F5F2EA]/60 sm:flex-row sm:items-center sm:p-5"
                            >
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded border border-[#E5E1D8] bg-[#F0EDE4] px-2 py-0.5 font-mono text-xs font-black text-[#4C6B36]">
                                            #{t.id}
                                        </span>
                                        <span
                                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${getClassBadgeStyle(t.ticketClass)}`}
                                        >
                                            {t.ticketClass}
                                        </span>
                                        <span
                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeStyle(t.status)}`}
                                        >
                                            {t.status}
                                        </span>
                                        <span className="flex items-center gap-1 font-mono text-[11px] text-[#8C877E]">
                                            <Calendar className="h-3 w-3 text-[#8C877E]" />
                                            {new Date(
                                                t.createdAt
                                            ).toLocaleDateString()}{' '}
                                            {new Date(
                                                t.createdAt
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>

                                    {/* Customer Information */}
                                    <div className="flex items-center gap-3 text-xs text-[#2D3025]">
                                        <span className="flex items-center gap-1 font-bold text-[#2D3025]">
                                            <User className="h-3.5 w-3.5 text-[#6B705C]" />
                                            {t.fullName}
                                        </span>
                                        <span className="text-[#E5E1D8]">
                                            |
                                        </span>
                                        <span className="flex items-center gap-1 font-mono text-[#6B705C]">
                                            <Mail className="h-3.5 w-3.5 text-[#6B705C]" />
                                            {t.email}
                                        </span>
                                    </div>

                                    {/* Message Preview */}
                                    <p className="line-clamp-2 rounded-lg border border-[#E5E1D8] bg-[#FDFCF8] p-2.5 text-xs leading-relaxed text-[#2D3025]">
                                        {t.message}
                                    </p>

                                    {t.ticketResponse && (
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4C6B36]">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4C6B36]" />
                                            <span className="truncate">
                                                Replied: {t.ticketResponse}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenTicket(t);
                                        }}
                                        className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#F0EDE4] px-3 py-1.5 text-xs font-bold text-[#4C6B36] transition hover:bg-[#E5E1D8]"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>Review</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleDeleteTicket(t.id || '');
                                        }}
                                        className="cursor-pointer rounded-lg p-1.5 text-[#8C877E] transition hover:bg-rose-50 hover:text-[#BA1A1A]"
                                        title="Delete Ticket"
                                    >
                                        {deletePending ? (
                                            <RefreshCw
                                                size={12}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ticket Details & Resolution Modal */}
            {viewingTicket && (
                <div
                    className="animate-fade-in fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4"
                    onClick={() => setViewingTicket(null)}
                >
                    <div
                        className="relative my-auto w-full max-w-2xl space-y-0 overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white text-left shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-[#2D4722] p-5 text-white">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-black text-emerald-200">
                                        #{viewingTicket.id}
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                            viewingTicket.ticketClass ===
                                            'REQUEST'
                                                ? 'bg-white/20 text-white'
                                                : viewingTicket.ticketClass ===
                                                    'COMMENT'
                                                  ? 'bg-[#D4A373]/30 text-amber-100'
                                                  : 'bg-rose-500/30 text-rose-100'
                                        }`}
                                    >
                                        {viewingTicket.ticketClass}
                                    </span>
                                </div>
                                <h3 className="mt-1 text-base font-bold text-white">
                                    Customer Issue & Resolution
                                </h3>
                            </div>

                            <button
                                onClick={() => setViewingTicket(null)}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            {/* Customer Contact Strip */}
                            <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E5E1D8] bg-[#F0EDE4]/60 p-3.5 sm:grid-cols-2">
                                <div>
                                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                                        Customer Name
                                    </span>
                                    <p className="mt-0.5 text-sm font-bold text-[#2D3025]">
                                        {viewingTicket.fullName}
                                    </p>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                                        Customer Email
                                    </span>
                                    <p className="mt-0.5 font-mono text-xs font-semibold text-[#2D3025]">
                                        {viewingTicket.email}
                                    </p>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-1.5">
                                <span className="block text-[11px] font-black tracking-wider text-[#6B705C] uppercase">
                                    Customer Inquiry / Message
                                </span>
                                <div className="rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-4 text-xs leading-relaxed font-medium whitespace-pre-wrap text-[#2D3025]">
                                    {viewingTicket.message}
                                </div>
                            </div>

                            {/* Status Update & Reply Section */}
                            <div className="space-y-4 border-t border-[#E5E1D8] pt-2">
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <span className="text-[11px] font-black tracking-wider text-[#2D3025] uppercase">
                                        Update Ticket Status
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        {(
                                            [
                                                'PENDING',
                                                'OPEN',
                                                'RESOLVED',
                                                'CLOSED',
                                            ] as const
                                        ).map((st) => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() =>
                                                    setNextStatus(st)
                                                }
                                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                                    nextStatus === st
                                                        ? 'bg-[#4C6B36] text-white shadow-xs'
                                                        : 'bg-[#F0EDE4] text-[#6B705C] hover:bg-[#E5E1D8]'
                                                }`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin Reply Box */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="block text-[11px] font-black tracking-wider text-[#2D3025] uppercase">
                                            Admin Response (Sent to customer)
                                        </span>
                                        <span className="text-[10px] text-[#6B705C]">
                                            Shows in customer ticket history &
                                            notifications
                                        </span>
                                    </div>
                                    <textarea
                                        rows={3}
                                        placeholder="Enter dispatch notes or resolution reply for the customer..."
                                        value={replyText}
                                        onChange={(e) =>
                                            setReplyText(e.target.value)
                                        }
                                        className="w-full resize-none rounded-xl border border-[#E5E1D8] bg-white p-3 text-xs leading-relaxed text-[#2D3025] placeholder-[#8C877E] transition focus:ring-2 focus:ring-[#4C6B36] focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-[#E5E1D8] pt-3">
                                <button
                                    type="button"
                                    onClick={() => setViewingTicket(null)}
                                    className="cursor-pointer px-4 py-2.5 text-xs font-bold text-[#6B705C] hover:text-[#2D3025]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveResolution}
                                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#4C6B36] px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-md transition hover:bg-[#3d572b]"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>
                                        {updatePending
                                            ? 'Saving...'
                                            : 'Save Resolution'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
