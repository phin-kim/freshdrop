import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef, useState } from 'react';
import {
    MdOutlineLocationOn,
    MdOutlineMap,
    MdOutlineMyLocation,
    MdOutlineSave,
} from 'react-icons/md';
import Map, { MapRef } from 'react-map-gl/mapbox';

import { useDeliveryStore } from '../Store/delivery';
import useErrorStore from '../Store/errorStore';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import debounce from '../Utils/mapDebouncer';

const log = createClientLogger('Maps.tsx');

interface Coordinates {
    lat: number;
    lng: number;
}
const MAPBOX_ACCESS_TOKEN =
    'pk.eyJ1IjoicGhpbmtpbSIsImEiOiJjbXB5em5lM2IwMDNiMnFwa2tsdGczejRoIn0.dx7X6_8GHSycsoYSJwmlfw';
const DeliveryLocationSelector = () => {
    const deliveryLocation = useDeliveryStore(
        (state) => state.deliveryLocation
    );
    const setError = useErrorStore((state) => state.setError);
    const setDeliveryLocation = useDeliveryStore(
        (state) => state.setDeliveryLocation
    );
    const deliveryLocationInput = useDeliveryStore(
        (state) => state.deliveryLocationInput
    );
    const setDeliveryLocationInput = useDeliveryStore(
        (state) => state.setDeliveryLocationInput
    );
    const [coords, setCoords] = useState<Coordinates>();
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const mapRef = useRef<MapRef>(null);

    //reverse geocoding api call
    const executeReverseGeocode = async (
        currentCoords: Coordinates
    ): Promise<void> => {
        const url = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${currentCoords.lng}&latitude=${currentCoords.lat}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
        try {
            const response = await axios.get(url);
            const data = response.data;
            const formattedAddress =
                data.features[0]?.properties?.full_address ||
                'Unknown Location';
            setDeliveryLocation(formattedAddress);
            setDeliveryLocationInput(formattedAddress);
        } catch (error) {
            log.error('Error in fetching location', { data: { error } });
            handleApiError(error, setError);
        }
    };

    const handleFetchLocation = (): void => {
        //check if browser supports geolocation
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        //success handler
        const handleSuccess = async (
            position: GeolocationPosition
        ): Promise<void> => {
            const currentCoords: Coordinates = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setCoords(currentCoords);
            await executeReverseGeocode(currentCoords);
            setIsLoading(false);
            setShowModal(true); // open the verification dialog

            //TO DO: pass the coordinates to Mapbox to center the map
            log.info('Coordinates captured successfully ', {
                data: { currentCoords },
            });
        };
        // error handler
        const handleError = (error: GeolocationPositionError): void => {
            let errorMessage =
                'An unknown error occurred while fetching location';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage =
                        'Location permission denied .Please allow location access in your browser settings';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage =
                        'LOcation information is unavailable from your device network';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'The request to get user location timed out';
                    break;
            }

            setError(errorMessage);
        };
        //fine tune performance options
        const geoOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };
        //trigger native browser prompt
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            geoOptions
        );
    };
    //create a debounced wrapper for map movements to control api costs
    // Solution to use-memo / debounce issue: Stored as a strict functional reference type layout
    const debouncedGeocodeRef = useRef<(targetCoords: Coordinates) => void>(
        debounce((targetCoords: Coordinates) => {
            executeReverseGeocode(targetCoords);
        }, 600)
    );
    //trigger every tme the user pans. drops the map canvas
    const handleMapMove = (): void => {
        if (!mapRef.current) return;
        //get coordinates directly fro camera center viewpoint
        const center = mapRef.current.getCenter();
        const mapCenterCoords = { lat: center.lat, lng: center.lng };
        setCoords(mapCenterCoords);
        debouncedGeocodeRef.current(mapCenterCoords);
    };
    const handleLocationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (deliveryLocationInput.trim()) {
            setDeliveryLocation(deliveryLocationInput);
        }
    };
    return (
        <>
            <div className="border-outline-variant/40 mx-auto max-w-xl space-y-4 rounded-2xl border bg-white p-5 shadow-sm lg:mx-0">
                <div className="text-left">
                    <span className="mb-1 block text-[10px] font-extrabold tracking-widest text-[#6B705C] uppercase">
                        DELIVER TO
                    </span>
                    <span className="text-primary flex items-center gap-1 text-base font-bold">
                        <span className="material-symbols-outlined text-lg">
                            <MdOutlineLocationOn />
                        </span>
                        {deliveryLocation}
                    </span>
                </div>

                <form
                    onSubmit={handleLocationSubmit}
                    className="flex flex-col gap-3"
                >
                    <div className="relative">
                        <span className="material-symbols-outlined text-outline absolute top-1/2 left-3.5 -translate-y-1/2">
                            <MdOutlineMap />
                        </span>
                        <input
                            type="text"
                            placeholder="Enter your delivery destination"
                            value={deliveryLocationInput}
                            onChange={(e) =>
                                setDeliveryLocationInput(e.target.value)
                            }
                            className="border-outline-variant/60 bg-surface-container-lowest focus:ring-primary w-full rounded-xl border py-3 pr-4 pl-10 text-sm transition-all outline-none focus:border-transparent focus:ring-2 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <button
                            type="submit"
                            className="bg-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold tracking-wider text-white uppercase transition-transform duration-150 hover:bg-[#005313] active:scale-95"
                        >
                            <span className="material-symbols-outlined text-sm">
                                <MdOutlineSave />
                            </span>
                            Update Destination
                        </button>

                        <div className="location-control">
                            <button
                                type="button"
                                onClick={handleFetchLocation}
                                disabled={isLoading}
                                className="text-primary flex items-center justify-center gap-2 rounded-xl border border-[#becab9] bg-white px-4 py-3 text-xs font-extrabold tracking-wider uppercase transition-transform duration-150 hover:bg-emerald-50 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    <MdOutlineMyLocation />{' '}
                                </span>
                                {isLoading
                                    ? 'Locating...'
                                    : ' Use Current Location'}
                            </button>

                            {coords && (
                                <p className="mt-2 text-sm text-green-600">
                                    Location locked: Lat {coords.lat.toFixed(4)}
                                    , Lng {coords.lng.toFixed(4)}
                                </p>
                            )}
                        </div>
                    </div>
                </form>
                {showMap && (
                    <div className="border-outline-variant/40 relative mt-4 h-64 w-full overflow-hidden rounded-2xl border shadow-inner">
                        <Map
                            ref={mapRef}
                            initialViewState={{
                                longitude: coords?.lng,
                                latitude: coords?.lat,
                                zoom: 15,
                            }}
                            onMove={handleMapMove}
                            mapStyle="mapbox://styles/mapbox/streets-v12"
                            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                        />

                        {/* CSS Pointer-Overlay centered pin layout */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="text-primary -translate-y-1/2 transform text-3xl drop-shadow-md">
                                <MdOutlineLocationOn className="text-primary text-4xl" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-200">
                    <div className="border-outline-variant/30 w-full max-w-sm scale-100 transform rounded-2xl border bg-white p-6 text-center shadow-xl transition-transform">
                        <div className="text-primary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                            <MdOutlineLocationOn className="text-2xl" />
                        </div>
                        <h3 className="mb-1.5 text-lg font-extrabold tracking-tight text-gray-800">
                            Is this location accurate?
                        </h3>
                        <p className="mb-5 line-clamp-3 px-2 text-xs font-medium text-gray-500">
                            {deliveryLocation}
                        </p>

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-primary w-full rounded-xl py-3 text-xs font-extrabold tracking-wider text-white uppercase transition-all hover:bg-[#005313] active:scale-[0.98]"
                            >
                                Yes, Confirm Address
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setShowMap(true);
                                }}
                                className="w-full rounded-xl border border-[#becab9] bg-white py-3 text-xs font-extrabold tracking-wider text-[#6B705C] uppercase transition-all hover:bg-gray-50 active:scale-[0.98]"
                            >
                                No, Fine-tune Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default DeliveryLocationSelector;
