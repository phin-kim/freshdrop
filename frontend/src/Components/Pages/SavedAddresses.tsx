import React, { useState } from 'react';

import { userApi } from '../../Library/api';
import { useAddressStore } from '../../Store/addressStore';
import type { AddressDetails } from '../../Store/addressStore';
import { useDeliveryStore } from '../../Store/delivery';
import useErrorStore from '../../Store/errorStore';
import useSuccessStore from '../../Store/successStore';
import handleApiError from '../../Utils/apiError';
import createClientLogger from '../../Utils/clientLogger';

const log = createClientLogger('SavedAddresses.tsx');

interface SavedAddressesProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SavedAddresses({
    isOpen,
    onClose,
}: SavedAddressesProps) {
    const address = useDeliveryStore((state) => state.address);
    const setError = useErrorStore((state) => state.setError);
    const setSuccess = useSuccessStore((state) => state.setSuccess);
    const deliveryDestination = useDeliveryStore(
        (state) => state.deliveryDestination
    );
    const setDeliveryFee = useDeliveryStore((state) => state.setDeliveryFee);
    const setDeliveryDistance = useDeliveryStore(
        (state) => state.setDeliveryDistance
    );
    const savedAddresses = useAddressStore((state) => state.savedAddresses);
    const [editingAddress, setEditingAddress] = useState<AddressDetails | null>(
        null
    );
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    //const [isDefaultInput, setIsDefaultInput] = useState(false);
    // Address form inputs
    const [addressTag, setAddressTag] = useState('Home');
    const [customTag, setCustomTag] = useState('');

    const houseNumber = useDeliveryStore((state) => state.address.houseNumber);
    const apartmentName = useDeliveryStore(
        (state) => state.address.apartmentName
    );
    const landmark = useDeliveryStore((state) => state.address.landmark);
    const isDefault = useDeliveryStore((state) => state.address.isDefault);
    const updateAddressField = useDeliveryStore(
        (state) => state.updateAddressField
    );

    /* const handleEditAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAddress) return;
        if (!apartmentNameInput.trim()) {
            setError('Please enter an apartment, plot, or building name.');
            return;
        }
        const finalTag =
            addressTag === 'Other' ? customTag.trim() || 'Other' : addressTag;
        savedAddresses.map((addr) => {
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
        setSuccess(`Address tagged "${finalTag}" updated!`);
        resetAddressForm();
    };*/
    const destinationLabel = addressTag ?? customTag ?? 'Home';
    log.debug(`Destination label set ${destinationLabel}`);
    const submitFinalDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        log.debug('this is the address details as we submit the data', {
            data: address,
        });
        // Bundle your data cleanly to pass to your store/backend

        try {
            const endpoint = editingAddress
                ? `/user/edit-address/${editingAddress.id}`
                : '/user/edit-address';
            const response = await userApi.post(endpoint, {
                destinationLabel,
                isDefault,
            });
            const data = response.data;

            log.debug('Response after saving the destination label', {
                data: data,
            });
            if (data.success && data.deliverySummary) {
                setDeliveryFee(data.deliverySummary.deliveryFee); // ✅ 50
                setDeliveryDistance(data.deliverySummary.distanceKm); // ✅ 0.65
            }

            // TODO: Save this bundle to your Zustand store or hit your backend address cache
            // setSavedAddressProfile(completeAddressBundle);

            setSuccess('You have successfully set your location');
        } catch (error) {
            handleApiError(error, setError);
        }
    };

    /*const handleDeleteAddress = (id: string, tag: string) => {
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
    };*/

    const startEditAddress = (addr: (typeof savedAddresses)[0]) => {
        setEditingAddress(addr);
        setIsAddingAddress(false);
        const label = addr.destinationLabel || 'Home';

        // 2. Determine if it is a preset
        const isPreset = ['Home', 'Work', 'School'].includes(label);

        // 3. Update states safely with guaranteed string values
        setAddressTag(isPreset ? label : 'Other');
        setCustomTag(isPreset ? '' : label);
        updateAddressField('apartmentName', addr.apartmentName || '');
        updateAddressField('houseNumber', addr.houseNumber || '');
        updateAddressField('landmark', addr.landmark || '');
        updateAddressField(
            'deliveryDestination',
            addr.deliveryDestination || ''
        );
        updateAddressField('destinationLabel', addr.destinationLabel || '');
        updateAddressField('isDefault', !!addr.isDefault);
    };

    const resetAddressForm = () => {
        setEditingAddress(null);
        setIsAddingAddress(false);
        setAddressTag('Home');
        setCustomTag('');
        // inside resetAddressForm()
        updateAddressField('apartmentName', '');
        updateAddressField('houseNumber', '');
        updateAddressField('landmark', '');
        updateAddressField('deliveryDestination', '');
        updateAddressField('destinationLabel', '');
        updateAddressField('isDefault', false);
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
                            onSubmit={submitFinalDetails}
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
                                        {deliveryDestination || 'Not recorded'}
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
                                    name="apartmentName"
                                    placeholder="e.g., Total Care Apartments, Sunrise Plaza"
                                    value={apartmentName}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) =>
                                        updateAddressField(
                                            'apartmentName',
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#47663b] focus:ring-1 focus:ring-[#47663b]"
                                    required
                                    //id="apartment-name-input"
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
                                        required
                                        placeholder="e.g., House B4, 3rd Floor"
                                        value={houseNumber}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                            updateAddressField(
                                                'houseNumber',
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#47663b] focus:ring-1 focus:ring-[#47663b]"
                                        //id="house-room-input"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black tracking-wider text-[#6B705C] uppercase">
                                        NEARBY LANDMARK *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Opposite Juja Stage"
                                        value={landmark ?? ''}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                            updateAddressField(
                                                'landmark',
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#47663b] focus:ring-1 focus:ring-[#47663b]"
                                        //id="landmark-input"
                                    />
                                </div>
                            </div>
                            <div
                                className="flex items-center gap-2.5 px-0.5 py-1"
                                id="is-default-checkbox-container"
                            >
                                <label className="flex cursor-pointer items-center gap-2.5 text-xs font-extrabold text-slate-700 select-none">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        checked={isDefault}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                            // 2. Use e.target.checked for true/false
                                            updateAddressField(
                                                'isDefault',
                                                e.target.checked
                                            )
                                        }
                                        className="focus:ring-opacity-20 h-4 w-4 cursor-pointer rounded border-slate-300 text-[#47663b] accent-[#47663b] focus:ring-[#47663b]"
                                        id="is-default-input"
                                    />
                                    <span>
                                        Set as default delivery destination
                                    </span>
                                </label>
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
                                    Saved Locations ({savedAddresses.length})
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

                            {savedAddresses.length === 0 ? (
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
                                    {savedAddresses.map((addr) => {
                                        let tagBadgeClass =
                                            'bg-amber-50 border-amber-200 text-amber-850';
                                        const normalizedLabel =
                                            addr.destinationLabel?.toLowerCase() ||
                                            '';
                                        if (!addr.destinationLabel) {
                                            tagBadgeClass = ''; //i wnat non of the buttons to have a color or behighlughted
                                        }
                                        // Tag color picker
                                        const isHome =
                                            normalizedLabel === 'home';
                                        const isWork =
                                            normalizedLabel === 'work';
                                        const isSchool =
                                            normalizedLabel === 'school';

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
                                                        {addr.destinationLabel}
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
                                                            // onClick={() =>
                                                            //     handleDeleteAddress(
                                                            //         addr.id,
                                                            //         addr.tag
                                                            //     )
                                                            // }
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
                                                        {addr.houseNumber && (
                                                            <div>
                                                                <span className="text-outline block text-[9px] font-black tracking-wider uppercase">
                                                                    House/Room
                                                                </span>
                                                                <p className="text-on-surface-variant text-xs font-bold">
                                                                    {
                                                                        addr.houseNumber
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
