import { useState } from 'react';
import { MdOutlineMyLocation } from 'react-icons/md';

import useErrorStore from '../Store/errorStore';
import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('navigator.tsx');
export interface Coordinates {
    lat: number;
    lng: number;
}
export interface LocationState {
    coordinates: Coordinates | null;
    error: string | null;
    isLoading: boolean;
}
export function CurrentLocationButton() {
    const [locationState, setLocationState] = useState<LocationState>({
        coordinates: null,
        error: null,
        isLoading: false,
    });
    const setError = useErrorStore((state) => state.setError);

    const handleFetchLocation = (): void => {
        //check if browser supports geolocation
        if (!navigator.geolocation) {
            setLocationState({
                coordinates: null,
                error: 'Geolocation is not supported by your browser',
                isLoading: false,
            });
            return;
        }
        setLocationState((prev) => ({ ...prev, isLoading: true, error: null }));
        //success handler
        const handleSuccess = (position: GeolocationPosition): void => {
            const targetCoords: Coordinates = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setLocationState({
                coordinates: targetCoords,
                error: null,
                isLoading: false,
            });
            //TO DO: pass the coordinates to Mapbox to center the map
            log.info('Coordinates captured successfully ', {
                data: { targetCoords },
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
            setLocationState({
                coordinates: null,
                error: errorMessage,
                isLoading: false,
            });
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
    return (
        <>
            <div className="location-control">
                <button
                    type="button"
                    onClick={handleFetchLocation}
                    disabled={locationState.isLoading}
                    className="text-primary flex items-center justify-center gap-2 rounded-xl border border-[#becab9] bg-white px-4 py-3 text-xs font-extrabold tracking-wider uppercase transition-transform duration-150 hover:bg-emerald-50 active:scale-95"
                >
                    <span className="material-symbols-outlined text-sm">
                        <MdOutlineMyLocation />{' '}
                    </span>
                    {locationState.isLoading
                        ? 'Locating...'
                        : ' Use Current Location'}
                </button>

                {locationState.error && (
                    <p className="mt-2 text-sm text-red-500">
                        {locationState.error}
                    </p>
                )}

                {locationState.coordinates && (
                    <p className="mt-2 text-sm text-green-600">
                        Location locked: Lat{' '}
                        {locationState.coordinates.lat.toFixed(4)}, Lng{' '}
                        {locationState.coordinates.lng.toFixed(4)}
                    </p>
                )}
            </div>
        </>
    );
}
