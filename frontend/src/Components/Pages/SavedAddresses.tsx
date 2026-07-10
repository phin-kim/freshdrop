import React, { useState } from 'react';

import { useAppContext } from '../AppContext';
import { useStore } from '../store';

interface SavedAddressesProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SavedAddresses({
    isOpen,
    onClose,
}: SavedAddressesProps) {
    const { addToast } = useStore();
    const { deliveryLocation } = useAppContext();

    const [addresses, setAddresses] = useState<
        {
            id: string;
            tag: string;
            apartmentName: string;
            houseRoom: string;
            landmark: string;
        }[]
    >(() => {
        try {
            const saved = localStorage.getItem('fh_saved_addresses');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((addr: any) => ({
                    id: addr.id || 'addr-' + Date.now(),
                    tag: addr.tag || 'Home',
                    apartmentName: addr.apartmentName || addr.addressLine || '',
                    houseRoom: addr.houseRoom || '',
                    landmark: addr.landmark || '',
                }));
            }
        } catch (e) {
            console.error('Error loading saved addresses', e);
        }
        return [
            {
                id: 'addr-1',
                tag: 'Home',
                apartmentName: 'Apartment 12B, Westlands Mall Area',
                houseRoom: 'B12',
                landmark: 'Westlands Mall',
            },
            {
                id: 'addr-2',
                tag: 'Work',
                apartmentName: 'Delta Corner',
                houseRoom: 'Ground Floor Office',
                landmark: 'Juja Town',
            },
        ];
    });

    const [editingAddress, setEditingAddress] = useState<{
        id: string;
        tag: string;
        apartmentName: string;
        houseRoom: string;
        landmark: string;
    } | null>(null);
    const [isAddingAddress, setIsAddingAddress] = useState(false);

    // Address form inputs
    const [addressTag, setAddressTag] = useState('Home');
    const [customTag, setCustomTag] = useState('');
    const [apartmentNameInput, setApartmentNameInput] = useState('');
    const [houseRoomInput, setHouseRoomInput] = useState('');
    const [landmarkInput, setLandmarkInput] = useState('');

    const saveAddressesToStorage = (updatedList: typeof addresses) => {
        setAddresses(updatedList);
        localStorage.setItem('fh_saved_addresses', JSON.stringify(updatedList));
    };

    const handleAddAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!apartmentNameInput.trim()) {
            addToast(
                'Please enter an apartment, plot, or building name.',
                'error'
            );
            return;
        }
        const finalTag =
            addressTag === 'Other' ? customTag.trim() || 'Other' : addressTag;
        const newAddr = {
            id: 'addr-' + Date.now(),
            tag: finalTag,
            apartmentName: apartmentNameInput.trim(),
            houseRoom: houseRoomInput.trim(),
            landmark: landmarkInput.trim(),
        };
        const updated = [...addresses, newAddr];
        saveAddressesToStorage(updated);
        addToast(`Address tagged "${finalTag}" has been added!`, 'success');
        resetAddressForm();
    };

    const handleEditAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAddress) return;
        if (!apartmentNameInput.trim()) {
            addToast(
                'Please enter an apartment, plot, or building name.',
                'error'
            );
            return;
        }
        const finalTag =
            addressTag === 'Other' ? customTag.trim() || 'Other' : addressTag;
        const updated = addresses.map((addr) => {
            if (addr.id === editingAddress.id) {
                return {
                    ...addr,
                    tag: finalTag,
                    apartmentName: apartmentNameInput.trim(),
                    houseRoom: houseRoomInput.trim(),
                    landmark: landmarkInput.trim(),
                };
            }
            return addr;
        });
        saveAddressesToStorage(updated);
        addToast(`Address tagged "${finalTag}" updated!`, 'success');
        resetAddressForm();
    };

    const handleDeleteAddress = (id: string, tag: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the saved address "${tag}"?`
        );
        if (confirmed) {
            const updated = addresses.filter((addr) => addr.id !== id);
            saveAddressesToStorage(updated);
            addToast(`Address "${tag}" has been deleted.`, 'info');
            if (editingAddress?.id === id) {
                resetAddressForm();
            }
        }
    };

    const startEditAddress = (addr: (typeof addresses)[0]) => {
        setEditingAddress(addr);
        setIsAddingAddress(false);
        setAddressTag(
            ['Home', 'Work', 'School'].includes(addr.tag) ? addr.tag : 'Other'
        );
        setCustomTag(
            ['Home', 'Work', 'School'].includes(addr.tag) ? '' : addr.tag
        );
        setApartmentNameInput(addr.apartmentName || '');
        setHouseRoomInput(addr.houseRoom || '');
        setLandmarkInput(addr.landmark || '');
    };

    const resetAddressForm = () => {
        setEditingAddress(null);
        setIsAddingAddress(false);
        setAddressTag('Home');
        setCustomTag('');
        setApartmentNameInput('');
        setHouseRoomInput('');
        setLandmarkInput('');
    };

    if (!isOpen) return null;

    return (
        <div
            className="animate-fade-in fixed inset-0 z-[110] flex justify-end bg-black/60 text-[#2D3025] backdrop-blur-sm"
            onClick={() => {
                onClose();
                resetAddressForm();
            }}
            id="saved-addresses-overlay"
        >
            <div
                className="animate-slide-in-right border-outline-variant/30 flex h-full w-full max-w-md flex-col overflow-hidden border-l bg-[#FDFCF8] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                id="saved-addresses-drawer"
            >
                {/* Drawer Header */}
                <div className="flex shrink-0 items-center justify-between bg-[#006e1c] p-5 text-white">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-2xl">
                            location_on
                        </span>
                        <div className="text-left">
                            <h3 className="font-sans text-base leading-none font-bold">
                                Saved Addresses
                            </h3>
                            <span className="mt-1 block text-[10px] font-bold tracking-widest text-emerald-100 uppercase">
                                Delivery Destination Manager
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            resetAddressForm();
                        }}
                        className="cursor-pointer text-white transition-colors hover:text-slate-100 focus:outline-none"
                        id="saved-addresses-close-btn"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            close
                        </span>
                    </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {/* If Form is Open (Add/Edit) */}
                    {isAddingAddress || editingAddress ? (
                        <form
                            onSubmit={
                                editingAddress
                                    ? handleEditAddress
                                    : handleAddAddress
                            }
                            className="border-outline-variant/15 space-y-5 rounded-2xl border bg-white p-5 text-left shadow-sm"
                            id="address-form"
                        >
                            {/* Last-Mile Logistics Branding block */}
                            <div className="border-outline-variant/10 space-y-1 border-b pb-2">
                                <span className="block text-[9px] font-black tracking-widest text-[#6B705C] uppercase">
                                    LAST-MILE LOGISTICS
                                </span>
                                <h4 className="text-on-surface font-sans text-lg leading-snug font-black">
                                    {editingAddress
                                        ? 'Edit Specific Delivery Details'
                                        : 'Add Specific Delivery Details'}
                                </h4>
                                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#006e1c]">
                                    <span className="material-symbols-outlined text-[15px] text-rose-600">
                                        location_on
                                    </span>
                                    <span>
                                        {deliveryLocation ||
                                            'Central Business District, Nairobi, Kenya'}
                                    </span>
                                </div>
                            </div>

                            {/* Location Tag preset */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black tracking-wider text-[#6B705C] uppercase">
                                    Location Tag
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['Home', 'Work', 'School', 'Other'].map(
                                        (tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() =>
                                                    setAddressTag(tag)
                                                }
                                                className={`cursor-pointer rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                                                    addressTag === tag
                                                        ? 'border-[#47663b] bg-[#47663b] font-extrabold text-white shadow-sm'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                                id={`tag-btn-${tag.toLowerCase()}`}
                                            >
                                                {tag}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Custom tag input if 'Other' is selected */}
                            {addressTag === 'Other' && (
                                <div
                                    className="animate-fade-in space-y-1.5"
                                    id="custom-tag-container"
                                >
                                    <label className="block text-[10px] font-black tracking-wider text-[#6B705C] uppercase">
                                        Custom Label Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Gym, Farm, Parent's House"
                                        value={customTag}
                                        onChange={(e) =>
                                            setCustomTag(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#47663b] focus:ring-1 focus:ring-[#47663b]"
                                        required
                                        id="custom-tag-input"
                                    />
                                </div>
                            )}

                            {/* APARTMENT, PLOT, OR BUILDING NAME * */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black tracking-wider text-[#6B705C] uppercase">
                                    APARTMENT, PLOT, OR BUILDING NAME *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Total Care Apartments, Sunrise Plaza"
                                    value={apartmentNameInput}
                                    onChange={(e) =>
                                        setApartmentNameInput(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#47663b] focus:ring-1 focus:ring-[#47663b]"
                                    required
                                    id="apartment-name-input"
                                />
                            </div>

                            {/* House Room No. & Nearby Landmark Row */}
                            <div className="grid grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black tracking-wider text-[#6B705C] uppercase">
                                        HOUSE / ROOM NO. *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., House B4, 3rd Floor"
                                        value={houseRoomInput}
                                        onChange={(e) =>
                                            setHouseRoomInput(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#47663b] focus:ring-1 focus:ring-[#47663b]"
                                        required
                                        id="house-room-input"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black tracking-wider text-[#6B705C] uppercase">
                                        NEARBY LANDMARK *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Opposite Juja Stage"
                                        value={landmarkInput}
                                        onChange={(e) =>
                                            setLandmarkInput(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#47663b] focus:ring-1 focus:ring-[#47663b]"
                                        required
                                        id="landmark-input"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons styled like the screenshot */}
                            <div className="space-y-2.5 pt-2">
                                <button
                                    type="submit"
                                    className="w-full cursor-pointer rounded-xl bg-[#47663b] py-3.5 text-center text-xs font-black tracking-widest text-white uppercase shadow-md transition-all hover:bg-[#3d5632] hover:shadow-lg"
                                    id="submit-address-btn"
                                >
                                    SAVE ADDRESS & CONTINUE
                                </button>
                                <button
                                    type="button"
                                    onClick={resetAddressForm}
                                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-3.5 text-center text-xs font-black tracking-widest text-slate-700 uppercase transition-all hover:bg-slate-50"
                                    id="cancel-address-btn"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Saved addresses list display */
                        <div
                            className="space-y-4 text-left"
                            id="addresses-list-container"
                        >
                            {/* Top quick-add action */}
                            <div className="border-outline-variant/10 mb-2 flex items-center justify-between border-b pb-3">
                                <span className="text-xs font-extrabold tracking-wider text-[#6B705C] uppercase">
                                    Saved Locations ({addresses.length})
                                </span>
                                <button
                                    onClick={() => {
                                        setIsAddingAddress(true);
                                    }}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black text-[#006e1c] hover:text-[#005313]"
                                    id="add-new-address-btn"
                                >
                                    <span className="material-symbols-outlined text-[15px]">
                                        add
                                    </span>
                                    <span>Add New</span>
                                </button>
                            </div>

                            {addresses.length === 0 ? (
                                <div
                                    className="text-outline space-y-3 py-12 text-center"
                                    id="no-addresses-placeholder"
                                >
                                    <span className="material-symbols-outlined text-outline/50 text-4xl">
                                        location_off
                                    </span>
                                    <p className="text-xs font-semibold">
                                        You have no saved delivery destinations.
                                        Add one to expedite checkout.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsAddingAddress(true);
                                        }}
                                        className="border-primary text-primary cursor-pointer rounded-xl border border-dashed px-4 py-2 text-xs font-bold transition-all hover:bg-emerald-50/50"
                                        id="add-address-placeholder-btn"
                                    >
                                        Add Address Now
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="space-y-3.5"
                                    id="saved-addresses-grid"
                                >
                                    {addresses.map((addr) => {
                                        // Tag color picker
                                        const isHome =
                                            addr.tag.toLowerCase() === 'home';
                                        const isWork =
                                            addr.tag.toLowerCase() === 'work';
                                        const isSchool =
                                            addr.tag.toLowerCase() === 'school';

                                        let tagBadgeClass =
                                            'bg-amber-50 border-amber-200 text-amber-850';
                                        if (isHome)
                                            tagBadgeClass =
                                                'bg-emerald-50 border-emerald-200 text-[#006e1c]';
                                        else if (isWork)
                                            tagBadgeClass =
                                                'bg-blue-50 border-blue-200 text-blue-800';
                                        else if (isSchool)
                                            tagBadgeClass =
                                                'bg-purple-50 border-purple-200 text-purple-800';

                                        return (
                                            <div
                                                key={addr.id}
                                                className="border-outline-variant/20 group relative space-y-2.5 rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-[#47663b]/35"
                                                id={`address-card-${addr.id}`}
                                            >
                                                {/* Card Tag & Action row */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        className={`rounded-md border px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${tagBadgeClass}`}
                                                    >
                                                        {addr.tag}
                                                    </span>

                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() =>
                                                                startEditAddress(
                                                                    addr
                                                                )
                                                            }
                                                            className="cursor-pointer rounded p-1 text-[#006e1c] transition-colors hover:bg-slate-100"
                                                            title="Edit details"
                                                            id={`edit-addr-${addr.id}`}
                                                        >
                                                            <span className="material-symbols-outlined text-[17px]">
                                                                edit
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteAddress(
                                                                    addr.id,
                                                                    addr.tag
                                                                )
                                                            }
                                                            className="cursor-pointer rounded p-1 text-rose-600 transition-colors hover:bg-rose-50"
                                                            title="Delete location"
                                                            id={`delete-addr-${addr.id}`}
                                                        >
                                                            <span className="material-symbols-outlined text-[17px]">
                                                                delete
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Address details */}
                                                <div className="space-y-1.5 font-sans">
                                                    <div>
                                                        <span className="text-outline block text-[9px] font-black tracking-wider uppercase">
                                                            Building / Apartment
                                                            / Plot
                                                        </span>
                                                        <p className="text-on-surface text-[13px] leading-tight font-bold">
                                                            {addr.apartmentName}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-1.5 text-left">
                                                        {addr.houseRoom && (
                                                            <div>
                                                                <span className="text-outline block text-[9px] font-black tracking-wider uppercase">
                                                                    House/Room
                                                                </span>
                                                                <p className="text-on-surface-variant text-xs font-bold">
                                                                    {
                                                                        addr.houseRoom
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                        {addr.landmark && (
                                                            <div>
                                                                <span className="text-outline block text-[9px] font-black tracking-wider uppercase">
                                                                    Nearby
                                                                    Landmark
                                                                </span>
                                                                <p className="text-on-surface-variant text-xs font-bold">
                                                                    {
                                                                        addr.landmark
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Informational guide */}
                            <div
                                className="mt-6 flex gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left"
                                id="address-guide"
                            >
                                <span className="material-symbols-outlined text-primary text-xl select-none">
                                    info
                                </span>
                                <p className="text-[11px] leading-relaxed font-semibold text-[#3e4a41]">
                                    Saved destinations are cached in your local
                                    session to streamline subsequent checkout
                                    flows without needing to re-enter
                                    coordinates.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
