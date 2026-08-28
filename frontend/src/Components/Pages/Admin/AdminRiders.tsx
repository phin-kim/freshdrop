import { useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    Edit3,
    Navigation,
    Plus,
    RefreshCw,
    Search,
    Star,
    Trash2,
    Truck,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    useCreateRider,
    useDeleteRider,
    useToggleRiderStatus,
    useUpdateRider,
} from '../../../Hooks/adminSynchronization';
import { adminAPI } from '../../../Library/api';
import useErrorStore from '../../../Store/errorStore';
import type { Rider, RiderFormState, RiderStatus } from '../../../Types/Riders';
import {
    createDefaultRiderForm,
    statusLabelMap,
    statusOptions,
} from '../../../Utils/adminUtils';
import handleApiError from '../../../Utils/apiError';
import createClientLogger from '../../../Utils/clientLogger';

const log = createClientLogger('AdminRiders.tsx');

export default function AdminRiders() {
    const setError = useErrorStore((state) => state.setError);
    //const [riders, setRiders] = useState<Rider[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [selectedVehicle, setSelectedVehicle] = useState<string>('All');
    const [editingRider, setEditingRider] = useState<Rider | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [form, setForm] = useState<RiderFormState>(createDefaultRiderForm());
    const { mutate: createRider, isPending: createPending } = useCreateRider();
    const { mutate: updateRider, isPending: updatePending } = useUpdateRider();
    const { mutate: deleteRider, isPending: deletePending } = useDeleteRider();
    const { mutate: toggleStatus } = useToggleRiderStatus();
    const {
        data: riders,
        isError,
        error,
        isFetching,
    } = useQuery<Rider[]>({
        queryKey: ['admin-riders'],
        queryFn: async () => {
            const response = await adminAPI.get('/admin/riders/all');
            const riderList = Array.isArray(response.data?.riders)
                ? (response.data.riders as Rider[])
                : [];
            return riderList;
        },
    });
    if (isError) {
        log.error('Error fetching riders', { data: { error } });
        handleApiError(error, setError);
    }
    if (isFetching) {
        <div className="flex h-96 items-center justify-center font-bold text-gray-500">
            Loading riders data...
        </div>;
    }

    const openAdd = () => {
        setIsAddOpen(true);
        setEditingRider(null);
        setForm(createDefaultRiderForm());
    };

    const openEdit = (rider: Rider) => {
        setEditingRider(rider);
        setForm({
            name: rider.name,
            email: rider.email,
            phoneNumber: rider.phoneNumber,
            vehicleType: rider.vehicleType || 'Electric Van',
            vehiclePlate: rider.vehiclePlate || '',
            dispatchHub: rider.dispatchHub || 'Juja Central Hub',
            status: rider.status,
            rating: rider.rating ?? 5,
        });
        setIsAddOpen(true);
    };

    const createNewRider = async (
        event: React.ChangeEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (
            !form.name.trim() ||
            !form.phoneNumber.trim() ||
            !form.vehicleType.trim() ||
            !form.email.trim()
        ) {
            setError('Name, phone,email and vehicle type are required');
            return;
        }
        if (form.vehicleType !== 'Cargo Bicycle' && !form.vehiclePlate) {
            setError('Plate number is required');
            return;
        }
        log.debug('Is Email being sent', {
            data: {
                name: form.name.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim(),
                vehicleType: form.vehicleType,
                vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
                dispatchHub: form.dispatchHub.trim(),
                status: form.status,
                rating: Number(form.rating) || 5,
            },
        });
        createRider(
            {
                name: form.name.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim(),
                vehicleType: form.vehicleType,
                vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
                dispatchHub: form.dispatchHub.trim(),
                status: form.status,
                rating: Number(form.rating) || 5,
            },
            {
                onSuccess: () => {
                    setIsAddOpen(false);
                    setForm(createDefaultRiderForm());
                },
            }
        );
    };

    const updateRiderRecord = async (riderId: string) => {
        const name = form.name?.trim() || '';
        const phoneNumber = form.phoneNumber?.trim() || '';
        const vehicleType = form.vehicleType?.trim() || '';

        if (!name || !phoneNumber || !vehicleType) {
            setError('Name, phone, and vehicle type are required');
            return;
        }
        if (form.vehicleType !== 'Cargo Bicycle' && !form.vehiclePlate) {
            setError('Plate number is required');
            return;
        }
        updateRider(
            {
                riderId: riderId,
                name: form.name.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim(),
                vehicleType: form.vehicleType,
                vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
                dispatchHub: form.dispatchHub.trim(),
                status: form.status,
                rating: Number(form.rating) || 5,
            },
            {
                onSuccess: () => {
                    setEditingRider(null);
                    setIsAddOpen(false);
                    setForm(createDefaultRiderForm());
                },
            }
        );
    };

    const deleteRiderRecord = async (riderId: string) => {
        deleteRider({
            riderId: riderId,
        });
    };

    const toggleRiderStatus = async (
        riderId: string,
        nextStatus: RiderStatus
    ) => {
        toggleStatus({
            riderId: riderId,
            nextStatus: nextStatus,
        });
    };

    const filteredRiders = useMemo(() => {
        return riders?.filter((rider) => {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                rider.name.toLowerCase().includes(search) ||
                rider.phoneNumber.toLowerCase().includes(search) ||
                (rider.vehiclePlate ?? '').toLowerCase().includes(search) ||
                (rider.dispatchHub ?? '').toLowerCase().includes(search);
            //(rider.hubLocation ?? '').toLowerCase().includes(search);

            const matchesStatus =
                selectedStatus === 'All' ||
                statusLabelMap[rider.status] === selectedStatus;
            const matchesVehicle =
                selectedVehicle === 'All' ||
                rider.vehicleType === selectedVehicle;

            return matchesSearch && matchesStatus && matchesVehicle;
        });
    }, [riders, searchTerm, selectedStatus, selectedVehicle]);

    const stats = useMemo(() => {
        const total = riders?.length;
        const available = riders?.filter(
            (r) => r.status === 'AVAILABLE'
        ).length;
        const onDelivery = riders?.filter(
            (r) => r.status === 'ON_DELIVERY'
        ).length;
        const completedToday = riders?.reduce(
            (sum, r) => sum + (r.completedToday ?? 0),
            0
        );

        return { total, available, onDelivery, completedToday };
    }, [riders]);

    return (
        <div id="admin-riders-section" className="space-y-6">
            {/* Header & Quick Action Buttons */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
                <div>
                    <h2 className="font-caveat text-on-surface flex items-center gap-2 text-[38px] leading-tight font-black">
                        <Truck className="h-5 w-5 text-emerald-600" />
                        Courier & Delivery Fleet Management
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-500">
                        Monitor active drivers, electric delivery vans,
                        motorbikes, and eco cargo bicycles across Juja and
                        Kiambu hubs.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 active:scale-98"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Courier
                    </button>
                </div>
            </div>

            {/* Fleet KPI Metrics */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        Fleet Strength
                    </p>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.total}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <Zap className="inline h-3 w-3" /> 100% verified
                        couriers
                    </span>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        Available for Dispatch
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">
                        {stats.available}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="inline h-3 w-3" /> Ready for
                        immediate orders
                    </span>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        En Route / Delivering
                    </p>
                    <p className="mt-1 text-2xl font-black text-purple-700">
                        {stats.onDelivery}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-purple-700">
                        <Navigation className="inline h-3 w-3" /> Active in
                        transit
                    </span>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        Completed Today
                    </p>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.completedToday}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <CheckCircle2 className="inline h-3 w-3 text-emerald-600" />{' '}
                        Successful doorstep drops
                    </span>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-xs md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search courier name, phone, plate number, or base hub..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-stone-50/80 py-2 pr-3.5 pl-9 text-xs text-stone-900 placeholder-stone-400 transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
                    <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1">
                        <span className="text-[11px] font-semibold text-stone-500">
                            Status:
                        </span>
                        {[
                            'All',
                            'Available',
                            'On Delivery',
                            'On Break',
                            'Offline',
                        ].map((st) => (
                            <button
                                key={st}
                                onClick={() => setSelectedStatus(st)}
                                className={`rounded px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
                                    selectedStatus === st
                                        ? 'bg-emerald-700 text-white shadow-2xs'
                                        : 'text-stone-600 hover:bg-stone-200/70'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1">
                        <span className="text-[11px] font-semibold text-stone-500">
                            Vehicle:
                        </span>
                        <select
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                            className="cursor-pointer border-none bg-transparent text-xs font-medium text-stone-700 focus:ring-0 focus:outline-none"
                        >
                            <option value="All">All Vehicles</option>
                            <option value="Electric Van">Electric Van</option>
                            <option value="Motorbike">Motorbike</option>
                            <option value="Cargo Bicycle">Cargo Bicycle</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Riders Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRiders?.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-400">
                        <Truck className="mx-auto mb-2 h-10 w-10 text-stone-300" />
                        <p className="font-semibold text-stone-700">
                            No couriers found
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                            Try changing filter criteria or register a new
                            rider.
                        </p>
                    </div>
                ) : (
                    filteredRiders?.map((r) => (
                        <div
                            key={r.id}
                            className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition duration-200 hover:shadow-md"
                        >
                            <div className="p-5">
                                {/* Rider Header & Status Badge */}
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={
                                                r.avatar ||
                                                `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(r.name)}`
                                            }
                                            alt={r.name}
                                            className="h-11 w-11 shrink-0 rounded-full border border-stone-200 bg-stone-100 object-cover"
                                        />
                                        <div>
                                            <h3 className="text-sm leading-tight font-bold text-stone-900 transition hover:text-emerald-800">
                                                {r.name}
                                            </h3>
                                            <h3 className="text-xs leading-tight font-medium text-stone-500 italic transition hover:text-emerald-800">
                                                {r.email}
                                            </h3>
                                            <p className="mt-0.5 text-xs font-medium text-stone-500">
                                                {r.dispatchHub}
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                            r.status === 'AVAILABLE'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : r.status === 'ON_DELIVERY'
                                                  ? 'bg-purple-100 text-purple-800'
                                                  : r.status === 'ON_BREAK'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-stone-100 text-stone-700'
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                r.status === 'AVAILABLE'
                                                    ? 'bg-emerald-600'
                                                    : r.status === 'ON_DELIVERY'
                                                      ? 'bg-purple-600'
                                                      : r.status === 'ON_BREAK'
                                                        ? 'bg-amber-600'
                                                        : 'bg-stone-400'
                                            }`}
                                        />
                                        {statusLabelMap[r.status]}
                                    </span>
                                </div>

                                {/* Vehicle & Contact Info */}
                                <div className="mt-3 space-y-2 rounded-xl border border-stone-100 bg-stone-50/80 p-3 text-xs text-stone-600">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-stone-500">
                                            Vehicle Unit:
                                        </span>
                                        <span className="font-bold text-stone-800">
                                            {r.vehicleType}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-stone-500">
                                            Plate / Identifier:
                                        </span>
                                        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono font-bold text-emerald-800 uppercase">
                                            {r.vehiclePlate}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-stone-200/60 pt-1">
                                        <span className="font-medium text-stone-500">
                                            Contact Phone:
                                        </span>
                                        <a
                                            href={`tel:${r.phoneNumber}`}
                                            className="font-mono font-bold text-emerald-700 hover:underline"
                                        >
                                            {r.phoneNumber}
                                        </a>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-lg bg-stone-50 p-2">
                                        <p className="text-[10px] font-semibold text-stone-400 uppercase">
                                            Rating
                                        </p>
                                        <p className="mt-0.5 flex items-center justify-center gap-0.5 text-xs font-bold text-amber-600">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{' '}
                                            {r.rating}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-stone-50 p-2">
                                        <p className="text-[10px] font-semibold text-stone-400 uppercase">
                                            Today Drops
                                        </p>
                                        <p className="mt-0.5 text-xs font-bold text-emerald-700">
                                            {r.stats?.todayDrops ?? 0}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-stone-50 p-2">
                                        <p className="text-[10px] font-semibold text-stone-400 uppercase">
                                            All-Time
                                        </p>
                                        <p className="mt-0.5 text-xs font-bold text-stone-800">
                                            {r.stats?.allTimeDrops ?? 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Status Toggle Buttons */}
                                <div className="mt-3 flex items-center justify-between gap-1 border-t border-stone-100 pt-3">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase">
                                        Quick Status:
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {statusOptions
                                            .filter(
                                                ({ value }) =>
                                                    value !== 'ON_DELIVERY'
                                            )
                                            .map(({ value, label }) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRiderStatus(
                                                            r.id,
                                                            value
                                                        )
                                                    }
                                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                                                        r.status === value
                                                            ? 'bg-stone-900 text-white'
                                                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Control Bar */}
                            <div className="flex items-center justify-between border-t border-stone-200/80 bg-stone-50/90 px-4 py-2.5 text-xs">
                                <span className="text-[11px] font-medium text-stone-500">
                                    Joined{' '}
                                    {r.createdAt
                                        ? new Date(
                                              r.createdAt
                                          ).toLocaleDateString()
                                        : 'N/A'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => openEdit(r)}
                                        className="rounded-lg p-1.5 text-stone-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                        title="Edit Rider"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    `Remove rider "${r.name}"?`
                                                )
                                            )
                                                void deleteRiderRecord(r.id);
                                        }}
                                        className="rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                                        title="Delete Rider"
                                    >
                                        {deletePending ? (
                                            <RefreshCw
                                                size={14}
                                                className={'animate-spin'}
                                            />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add / Edit Rider Modal */}
            {(isAddOpen || editingRider) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
                    <div className="animate-in fade-in zoom-in-95 my-8 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900">
                                <Truck className="h-5 w-5 text-emerald-600" />
                                {editingRider
                                    ? `Edit Courier: ${editingRider.name}`
                                    : 'Register New Courier / Driver'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsAddOpen(false);
                                    setEditingRider(null);
                                }}
                                className="rounded-lg p-1 text-sm text-stone-400 hover:text-stone-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={
                                editingRider
                                    ? (event) => {
                                          event.preventDefault();
                                          void updateRiderRecord(
                                              editingRider.id
                                          );
                                      }
                                    : createNewRider
                            }
                            className="space-y-4 pt-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                    Courier Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Juma Baraza"
                                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.phoneNumber}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                phoneNumber: e.target.value,
                                            }))
                                        }
                                        placeholder="+254 712 345 678"
                                        className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                        Email *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                email: e.target.value,
                                            }))
                                        }
                                        placeholder="+254 712 345 678"
                                        className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    />
                                </div>
                                {/*{!editingRider && (
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                            Password*
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.password}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    password: e.target.value,
                                                }))
                                            }
                                            placeholder="+254 712 345 678"
                                            className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                        />
                                    </div>
                                )}*/}

                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={form.vehicleType}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                vehicleType: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    >
                                        <option value="Electric Van">
                                            Electric Van
                                        </option>
                                        <option value="Motorbike">
                                            Motorbike
                                        </option>
                                        <option value="Cargo Bicycle">
                                            Cargo Bicycle
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                        Vehicle Registration / Plate
                                    </label>
                                    <input
                                        type="text"
                                        value={form.vehiclePlate}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                vehiclePlate: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. KDM 892J (#04)"
                                        className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono text-xs uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                        Base Dispatch Hub
                                    </label>
                                    <select
                                        value={form.dispatchHub}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                dispatchHub: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    >
                                        <option value="Juja Central Hub">
                                            Juja Central Hub
                                        </option>
                                        <option value="Kiambu North Hub">
                                            Kiambu North Hub
                                        </option>
                                        <option value="Thika Hub">
                                            Thika Hub
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/*<div>
                                    <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                        Initial Status
                                    </label>
                                    <select
                                        value={form.status}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                status: e.target
                                                    .value as RiderStatus,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    >
                                        {statusOptions.map(
                                            ({ value, label }) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>*/}

                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-wider text-stone-700 uppercase">
                                        Performance Rating
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        max="5"
                                        value={form.rating}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                rating: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddOpen(false);
                                        setEditingRider(null);
                                        setForm(createDefaultRiderForm());
                                    }}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createPending || updatePending}
                                    className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 active:scale-98 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {editingRider
                                        ? updatePending
                                            ? 'Saving...'
                                            : 'Save Changes'
                                        : createPending
                                          ? 'Registering...'
                                          : 'Register Courier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
