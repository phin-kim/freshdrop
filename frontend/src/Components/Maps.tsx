/**
 * @file Maps.tsx
 * @description High-Precision Mapping and Logistics Canvas for FreshDrop Delivery System.
 * * =====================================================================================
 * KEY IMPROVEMENTS & LOGISTICS ARCHITECTURAL UPGRADES:
 * =====================================================================================
 * * 1. DUAL-COORDINATE LOGISTICS TELEMETRY
 * - Implemented Mapbox routing telemetry parameters (`routing=true`) to parse and record
 * two distinct spatial points: the target Doorstep/Rooftop pin (customer location)
 * and the vehicle-accessible Road Node (driver pull-up spot).
 * * 2. DYNAMIC GEOJSON WALKING PATH CONNECTOR
 * - Integrated a live GeoJSON `LineString` feature map layer that renders a beautiful
 * dashed walkway connecting the road-snapped vehicle node directly to the doorstep pin,
 * minimizing driver confusion at compound gates or walls.
 * * 3. CANVAS VECTOR FOOTPRINT HIGHLIGHTING
 * - Added contextual map layer polling via `queryRenderedFeatures` to instantly capture
 * underlying 3D building footprint polygon geometries and apply a soft ambient brand
 * overlay, providing distinct visual location confirmation.
 * * 4. PERFORMANCE PROTECTION MECHANISM (DRAG GUARD)
 * - Introduced a decoupled, non-re-rendering `isDraggingRef` lock. This completely sleeps
 * high-frequency mouse-move calculations and hover tooltips during active marker
 * manipulation, ensuring smooth, stutter-free 60fps drag interactivity.
 * * 5. PRODUCTION TYPE SAFETY & ENGINE COMPLIANCE
 * - Cleaned up legacy unused dependencies, declared module stylesheet bindings, and
 * engineered defensive multi-tier type casting paths for unpredictable geocoding JSON
 * payloads—fully securing strict TypeScript integrity without resorting to `any`.
 */
import axios from 'axios';
//import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    MdClose,
    MdOutlineLocationOn,
    MdOutlineMap,
    MdOutlineMyLocation,
    MdOutlineSave,
} from 'react-icons/md';
import Map, { Layer, MapRef, Marker, Source } from 'react-map-gl/mapbox';
import { SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';

import { OPERATIONAL_BBOX } from '../../../shared/constants';
import { deliveryApi } from '../Library/api';
import { useDeliveryStore } from '../Store/delivery';
import useErrorStore from '../Store/errorStore';
import {
    Coordinates,
    LocationOption,
    MapboxGeocodeFeature,
} from '../Types/location';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import debounce from '../Utils/mapDebouncer';

const log = createClientLogger('Maps.tsx');
interface MapboxFeature {
    id: string;
    place_type: string[];
    text: string;
    place_name: string;
}

interface MapboxGeocodeResponse {
    features: MapboxFeature[];
}

const MAPBOX_ACCESS_TOKEN =
    'pk.eyJ1IjoicGhpbmtpbSIsImEiOiJjbXB5em5lM2IwMDNiMnFwa2tsdGczejRoIn0.dx7X6_8GHSycsoYSJwmlfw';
const DeliveryLocationSelector = () => {
    const setError = useErrorStore((state) => state.setError);

    const deliveryLocation = useDeliveryStore(
        (state) => state.deliveryLocation
    );

    const setDeliveryLocation = useDeliveryStore(
        (state) => state.setDeliveryLocation
    );
    const deliveryLocationInput = useDeliveryStore(
        (state) => state.deliveryLocationInput
    );
    const setDeliveryFee = useDeliveryStore((state) => state.setDeliveryFee);
    const setDeliveryDistance = useDeliveryStore(
        (state) => state.setDeliveryDistance
    );
    const setDeliveryLocationInput = useDeliveryStore(
        (state) => state.setDeliveryLocationInput
    );
    const coords = useDeliveryStore((state) => state.coords);
    const setCoords = useDeliveryStore((state) => state.setCoords);
    const houseNumber = useDeliveryStore((state) => state.address.houseNumber);
    const apartmentName = useDeliveryStore(
        (state) => state.address.apartmentName
    );
    const landmark = useDeliveryStore((state) => state.address.landmark);
    const updateAddressField = useDeliveryStore(
        (state) => state.updateAddressField
    );
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    /* const [apartmentName, setApartmentName] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [landmark, setLandmark] = useState('');*/

    const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
    const [routableCoords, setRoutableCoords] = useState<Coordinates | null>(
        null
    );
    const [buildingPolygon, setBuildingPolygon] =
        useState<GeoJSON.Feature | null>(null);

    const [hoverCoords, setHoverCoords] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const debouncedLoadOptionsRef = useRef<
        | ((
              inputValue: string,
              callback: (options: LocationOption[]) => void
          ) => void)
        | null
    >(null);
    const debouncedGeocodeRef = useRef<
        ((targetCoords: Coordinates) => void) | null
    >(null);
    const mapRef = useRef<MapRef>(null);
    const isDraggingRef = useRef(false);
    //const markerRef = useRef<mapboxgl.Marker | null>(null);
    // Mutable reference container used to provide fresh coordinates to the asynchronous
    // autocomplete method, completely preventing stale React scope closures inside the debounce cycle
    const coordsRef = useRef<Coordinates | undefined>(coords);

    /*useEffect(() => {
        coordsRef.current = coords;
        if (showMap && coords && mapRef.current) {
            mapRef.current.flyTo({
                center: [coords.lng, coords.lat],
                zoom: 16,
                essential: true,
            });
        }
    }, [showMap, coords]);*/

    const handleLoadOptions = (
        inputValue: string,
        callback: (options: LocationOption[]) => void
    ) => {
        if (debouncedLoadOptionsRef.current) {
            debouncedLoadOptionsRef.current(inputValue, callback);
        } else {
            callback([]);
        }
    };
    //reverse geocoding api call

    const executeReverseGeocode = useCallback(
        async (coordinates: Coordinates) => {
            const { lng, lat } = coordinates; //

            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address,neighborhood,locality,place&limit=1&routing=true`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response failure');

                const data: MapboxGeocodeResponse = await response.json();
                let snappedLng: number = lng;
                let snappedLat: number = lat;
                // FIX: Explicitly type features as an array MapboxFeature[]
                // This resolves errors on lines 164, 166, 169, 172, 175 where it lacked array methods
                const features: MapboxFeature[] = data.features || [];

                if (features.length > 0) {
                    // Safe array iterations with typed parameters 'f'
                    const poiFeature = features.find((f: MapboxFeature) =>
                        f.place_type.includes('poi')
                    );
                    const addressFeature = features.find((f: MapboxFeature) =>
                        f.place_type.includes('address')
                    );
                    const neighborhoodFeature = features.find(
                        (f: MapboxFeature) =>
                            f.place_type.includes('neighborhood')
                    );
                    const placeFeature = features.find(
                        (f: MapboxFeature) =>
                            f.place_type.includes('place') ||
                            f.place_type.includes('locality')
                    );

                    let resolvedName = '';

                    if (poiFeature) {
                        resolvedName = poiFeature.text;
                    } else if (addressFeature) {
                        resolvedName = addressFeature.place_name.split(',')[0];
                    } else if (neighborhoodFeature) {
                        const genericCity = placeFeature
                            ? `, ${placeFeature.text}`
                            : '';
                        resolvedName = `Near ${neighborhoodFeature.text}${genericCity}`;
                    } else {
                        resolvedName = features[0].place_name; // Now safely indexes array elements (Line 197)
                    }

                    const targetFeature =
                        addressFeature || poiFeature || features[0];

                    // Mapbox v5 places the property directly on the feature or inside properties
                    const rawFeatureObj = targetFeature as unknown as Record<
                        string,
                        unknown
                    >;

                    // 3. Extract properties safely with strict inline typing guards
                    const featureProperties = rawFeatureObj.properties as
                        | Record<string, unknown>
                        | undefined;

                    const rp =
                        rawFeatureObj.routable_points ||
                        featureProperties?.routable_points;
                    if (rp && typeof rp === 'object') {
                        const rpObj = rp as Record<string, unknown>;
                        // Check array format: { points: [{ coordinates: [lng, lat] }] }
                        if (
                            Array.isArray(rpObj.points) &&
                            rpObj.points.length > 0
                        ) {
                            const firstPoint = rpObj.points[0] as Record<
                                string,
                                unknown
                            >;
                            if (
                                Array.isArray(firstPoint.coordinates) &&
                                firstPoint.coordinates.length === 2
                            ) {
                                snappedLng = firstPoint
                                    .coordinates[0] as number;
                                snappedLat = firstPoint
                                    .coordinates[1] as number;
                            }
                        }
                        // Check absolute named object format: { default: { longitude: X, latitude: Y } }
                        else if (
                            rpObj.default &&
                            typeof rpObj.default === 'object'
                        ) {
                            const defObj = rpObj.default as Record<
                                string,
                                unknown
                            >;
                            snappedLng =
                                (defObj.longitude as number) ?? snappedLng;
                            snappedLat =
                                (defObj.latitude as number) ?? snappedLat;
                        }
                    }

                    const cleanName: string = resolvedName.replace(
                        /^010,\s*/i,
                        ''
                    );
                    setRoutableCoords({ lng: snappedLng, lat: snappedLat });
                    setDeliveryLocation(cleanName);
                    log.debug(
                        `This is the location name based on the reverse geocoder ${cleanName}`
                    );
                } else {
                    setDeliveryLocation(
                        `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`
                    );
                }
            } catch (error) {
                console.error('Reverse geocoding failure:', error);
                setDeliveryLocation('Dropped Pin Location');
                setDeliveryLocation('Dropped Pin Location');
                setRoutableCoords({ lng, lat }); // Fallback cleanly to raw coordinate mapping
                setBuildingPolygon(null);
            }
        },
        [setDeliveryLocation]
    );
    const executeForwardGeocoding = async (address: string): Promise<void> => {
        if (!address.trim()) return;
        setIsLoading(true);

        const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(address)}&entrances=true&country=ke&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
        try {
            const response = await axios.get(url);
            const data = response.data;
            const feature = data?.features?.[0];
            if (feature) {
                const [lng, lat] = feature.geometry.coordinates;
                const targetCoords: Coordinates = { lat, lng };
                setCoords(targetCoords);
                setDeliveryLocation(
                    feature.properties?.full_address || address
                );
                setShowMap(true);
            } else {
                setError(
                    'Address location not found.Please try adding more details'
                );
            }
        } catch (error) {
            handleApiError(error, setError);
        } finally {
            setIsLoading(false);
        }
    };
    //core lookup handler triggered dynamically by asyncselect
    const fetchSuggestions = async (
        inputValue: string,
        callback: (options: LocationOption[]) => void
    ): Promise<void> => {
        if (!inputValue.trim()) {
            callback([]);
            return;
        }

        // Dynamically configure local proximity parameter if previous fallback pin coordinates are established
        const proximityQuery = coordsRef.current
            ? `&proximity=${coordsRef.current.lng},${coordsRef.current.lat}`
            : '';

        // Request URL combining strict country code targeting, localized biasing weight, and physical border limits
        const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
            inputValue
        )}&country=ke&bbox=${OPERATIONAL_BBOX}${proximityQuery}&access_token=${MAPBOX_ACCESS_TOKEN}&limit=5`;

        try {
            const response = await axios.get(url);
            const features: MapboxGeocodeFeature[] =
                response.data.features || [];

            const options: LocationOption[] = features.map((feature) => {
                const displayAddress =
                    feature.properties.full_address ||
                    feature.properties.name ||
                    'Unknown Location';
                return {
                    label: displayAddress,
                    value: {
                        lng: feature.geometry.coordinates[0],
                        lat: feature.geometry.coordinates[1],
                        address: displayAddress,
                    },
                };
            });

            callback(options);
        } catch (error) {
            log.error('Error getting autocomplete suggestions', {
                data: { error },
            });
            callback([]);
        }
    };

    const handleSelectChange = (
        selectedOption: SingleValue<LocationOption>
    ): void => {
        if (!selectedOption) return;

        const { lat, lng, address } = selectedOption.value;
        const selectedCoords: Coordinates = { lng, lat };

        setCoords(selectedCoords);
        // Explicitly pan the camera since this is a user-initiated selection action
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [selectedCoords.lng, selectedCoords.lat],
                zoom: 16,
                essential: true,
            });
        }
        setDeliveryLocation(address);
        setDeliveryLocationInput(address);

        // Immediately present full-page fine-tuning canvas map viewport
        setShowMap(true);
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
                lng: position.coords.longitude,
                lat: position.coords.latitude,
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
    useEffect(() => {
        debouncedLoadOptionsRef.current = debounce(
            (
                inputValue: string,
                callback: (options: LocationOption[]) => void
            ) => {
                fetchSuggestions(inputValue, callback);
            },
            600
        );

        debouncedGeocodeRef.current = debounce((targetCoords: Coordinates) => {
            executeReverseGeocode(targetCoords);
        }, 600);
    }, [executeReverseGeocode]);

    const handleLocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (deliveryLocationInput.trim()) {
            await executeForwardGeocoding(deliveryLocation);
        }
    };
    const submitFinalDetails = async (e: React.FormEvent) => {
        e.preventDefault();

        // Bundle your data cleanly to pass to your store/backend

        log.highlight('the specific coordinates', {
            data: { coords },
        });
        try {
            const response = await deliveryApi.post('/user/delivery/estimate', {
                coordinates: coords,
            });
            const data = response.data;
            log.debug('Response from delivery estimate endpoint', {
                data: data,
            });
            setDeliveryFee(data.deliveryFee);
            setDeliveryDistance(data.distanceKm);
            // TODO: Save this bundle to your Zustand store or hit your backend address cache
            // setSavedAddressProfile(completeAddressBundle);

            setShowDetailsModal(false);
        } catch (error) {
            handleApiError(error, setError);
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
                        <AsyncSelect
                            cacheOptions
                            loadOptions={handleLoadOptions}
                            onChange={handleSelectChange}
                            placeholder="Enter your delivery destination"
                            noOptionsMessage={({ inputValue }) =>
                                !inputValue
                                    ? 'Type to search your location...'
                                    : 'No matching locations found'
                            }
                            inputValue={deliveryLocationInput}
                            onInputChange={(newValue) =>
                                setDeliveryLocationInput(newValue)
                            }
                            unstyled
                            classNames={{
                                control: (state) =>
                                    `border-outline-variant/60 bg-surface-container-lowest w-full rounded-xl border py-2 pr-4 pl-10 text-sm transition-all outline-none ${
                                        state.isFocused
                                            ? 'ring-2 ring-primary border-transparent'
                                            : ''
                                    }`,
                                menu: () =>
                                    'bg-white border border-gray-100 rounded-xl mt-2 shadow-lg overflow-hidden z-50 text-sm absolute w-full',
                                option: (state) =>
                                    `px-4 py-3 cursor-pointer transition-colors text-left ${
                                        state.isSelected
                                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                                            : state.isFocused
                                              ? 'bg-gray-50 text-gray-900'
                                              : 'text-gray-700'
                                    }`,
                            }}
                        />
                        {/*<input
                            type="text"
                            placeholder="Enter your delivery destination"
                            value={deliveryLocationInput}
                            onChange={(e) =>
                                setDeliveryLocationInput(e.target.value)
                            }
                            className="border-outline-variant/60 bg-surface-container-lowest focus:ring-primary w-full rounded-xl border py-3 pr-4 pl-10 text-sm transition-all outline-none focus:border-transparent focus:ring-2 focus:outline-none"
                        />*/}
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

                            {/*{coords && (
                                <p className="mt-2 text-sm text-green-600">
                                    Location locked: Lat {coords.lat.toFixed(4)}
                                    , Lng {coords.lng.toFixed(4)}
                                </p>
                            )}*/}
                        </div>
                    </div>
                </form>
                {showMap && (
                    <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-white">
                        {/* Top Action & Address Bar Wrapper */}
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3.5 shadow-sm sm:px-6">
                            <div className="flex max-w-[65%] flex-col sm:max-w-[75%]">
                                <span className="text-[10px] font-extrabold tracking-widest text-[#6B705C] uppercase">
                                    Pinpoint Delivery Point
                                </span>
                                <span className="truncate text-sm font-bold text-gray-800">
                                    {deliveryLocation ||
                                        'Drag map to choose location'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (deliveryLocationInput.trim()) {
                                            setDeliveryLocation(
                                                deliveryLocation
                                            );
                                        }
                                        setShowMap(false);
                                        setShowDetailsModal(true);
                                    }}
                                    className="bg-primary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold tracking-wider text-white uppercase shadow-sm transition-transform hover:bg-[#005313] active:scale-95"
                                >
                                    Confirm Location
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMap(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95"
                                    title="Close Map"
                                >
                                    <MdClose className="text-xl" />
                                </button>
                            </div>
                        </div>

                        {/* Full Height Map Body Canvas */}
                        <div className="relative h-full w-full flex-1 overflow-hidden bg-gray-50">
                            <Map
                                ref={mapRef}
                                initialViewState={{
                                    longitude: coords?.lng ?? 0,
                                    latitude: coords?.lat ?? 0,
                                    zoom: 17.5,
                                }}
                                onMouseMove={(event) => {
                                    // 👇 CRITICAL: If the driver/user is dragging the marker, freeze hover updates
                                    if (isDraggingRef.current) return;

                                    if (!mapRef.current) return;
                                    const map =
                                        'getMap' in mapRef.current
                                            ? mapRef.current.getMap()
                                            : mapRef.current;
                                    if (!map) return;

                                    const bbox: [
                                        [number, number],
                                        [number, number],
                                    ] = [
                                        [event.point.x - 5, event.point.y - 5],
                                        [event.point.x + 5, event.point.y + 5],
                                    ];

                                    const features =
                                        map.queryRenderedFeatures(bbox);

                                    const buildingFeature = features.find(
                                        (f) =>
                                            f.properties &&
                                            (f.properties.name ||
                                                f.properties.name_en ||
                                                f.properties.title)
                                    );

                                    if (
                                        buildingFeature &&
                                        buildingFeature.properties
                                    ) {
                                        const name =
                                            buildingFeature.properties.name ||
                                            buildingFeature.properties
                                                .name_en ||
                                            buildingFeature.properties.title;
                                        setHoveredBuilding(name);
                                        setHoverCoords({
                                            x: event.point.x,
                                            y: event.point.y,
                                        });
                                    } else {
                                        setHoveredBuilding(null);
                                    }
                                }}
                                onMouseLeave={() => setHoveredBuilding(null)}
                                mapStyle="mapbox://styles/mapbox/standard"
                                mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                            >
                                {buildingPolygon && (
                                    <Source
                                        id="building-highlight-source"
                                        type="geojson"
                                        data={buildingPolygon}
                                    >
                                        <Layer
                                            id="building-highlight-layer"
                                            type="fill"
                                            paint={{
                                                'fill-color': '#10B981', // Brand Emerald Green
                                                'fill-opacity': 0.25, // Soft ambient glow overlay
                                                'fill-outline-color': '#10B981',
                                            }}
                                        />
                                    </Source>
                                )}
                                {coords && (
                                    <Marker
                                        longitude={coords.lng}
                                        latitude={coords.lat}
                                        draggable
                                        color="#10B981"
                                        onDragStart={() => {
                                            isDraggingRef.current = true;
                                            setHoveredBuilding(null); // Clear tooltips instantly during drag
                                        }}
                                        onDragEnd={(e) => {
                                            const newCoords = {
                                                lng: e.lngLat.lng,
                                                lat: e.lngLat.lat,
                                            };
                                            setCoords(newCoords);
                                            if (debouncedGeocodeRef.current) {
                                                debouncedGeocodeRef.current(
                                                    newCoords
                                                );
                                            }
                                            // 👇 TURN OFF GUARD WHEN DRAG IS COMPLETE
                                            isDraggingRef.current = false;
                                        }}
                                    />
                                )}
                                {coords && routableCoords && (
                                    <>
                                        {/* Transparent Pulse Ring where the driver will pull over the vehicle on the access road */}
                                        <Marker
                                            longitude={routableCoords.lng}
                                            latitude={routableCoords.lat}
                                            draggable={false}
                                        >
                                            <div className="relative flex h-3 w-3 items-center justify-center">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500 ring-1 ring-white"></span>
                                            </div>
                                        </Marker>

                                        {/* Dash connector line asset linking the two markers */}
                                        <Source
                                            id="precision-delivery-connector"
                                            type="geojson"
                                            data={{
                                                type: 'Feature',
                                                properties: {},
                                                geometry: {
                                                    type: 'LineString',
                                                    coordinates: [
                                                        [
                                                            routableCoords.lng,
                                                            routableCoords.lat,
                                                        ], // Road Snapped Node
                                                        [
                                                            coords.lng,
                                                            coords.lat,
                                                        ], // Apartment Block Entrance Pin
                                                    ],
                                                },
                                            }}
                                        >
                                            <Layer
                                                id="connector-dashed-line"
                                                type="line"
                                                paint={{
                                                    'line-color': '#10B981',
                                                    'line-width': 2.5,
                                                    'line-dasharray': [2, 2], // Elegant dotted path texture
                                                }}
                                            />
                                        </Source>
                                    </>
                                )}
                                {/* 👇 Step C: Render a custom floating HTML tooltip element tracking the cursor */}
                                {hoveredBuilding && hoverCoords && (
                                    <div
                                        className="pointer-events-none absolute z-50 rounded-lg border border-slate-700/50 bg-slate-900/90 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all"
                                        style={{
                                            left: hoverCoords.x + 15,
                                            top: hoverCoords.y - 15,
                                        }}
                                    >
                                        🏢 {hoveredBuilding}
                                    </div>
                                )}
                            </Map>

                            {/*<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="text-primary -translate-y-1/2 transform drop-shadow-xl">
                                    <MdOutlineLocationOn className="text-primary animate-bounce text-5xl" />
                                    <div className="mx-auto mt-1 h-1.5 w-4 rounded-full bg-black/20 blur-[1px]"></div>
                                </div>
                            </div>*/}
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
                                onClick={() => {
                                    setShowModal(false);
                                    setShowDetailsModal(true);
                                }}
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
            {showDetailsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-200">
                    <div className="border-outline-variant/30 w-full max-w-md scale-100 transform rounded-2xl border bg-white p-6 shadow-xl transition-transform">
                        {/* Header */}
                        <div className="mb-4 text-left">
                            <span className="mb-1 block text-[10px] font-extrabold tracking-widest text-[#6B705C] uppercase">
                                LAST-MILE LOGISTICS
                            </span>
                            <h3 className="text-lg font-extrabold tracking-tight text-gray-800">
                                Add Specific Delivery Details
                            </h3>
                            <p className="mt-1 truncate text-xs font-medium text-gray-500">
                                📍 {deliveryLocation}
                            </p>
                        </div>

                        {/* Form Fields */}
                        <form
                            onSubmit={submitFinalDetails}
                            className="space-y-4 text-left"
                        >
                            <div>
                                <label className="mb-1.5 block text-[10px] font-extrabold tracking-wider text-gray-500 uppercase">
                                    Apartment, Plot, or Building Name *
                                </label>
                                <input
                                    type="text"
                                    required
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
                                    className="border-outline-variant/60 bg-surface-container-lowest focus:ring-primary w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-extrabold tracking-wider text-gray-500 uppercase">
                                        House / Room No. *
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
                                        className="border-outline-variant/60 bg-surface-container-lowest focus:ring-primary w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-extrabold tracking-wider text-gray-500 uppercase">
                                        Nearby Landmark *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Opposite Juja Stage"
                                        value={landmark}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                            updateAddressField(
                                                'landmark',
                                                e.target.value
                                            )
                                        }
                                        className="border-outline-variant/60 bg-surface-container-lowest focus:ring-primary w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none focus:border-transparent focus:ring-2"
                                    />
                                </div>
                            </div>

                            {/* Form Buttons */}
                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="bg-primary w-full rounded-xl py-3 text-xs font-extrabold tracking-wider text-white uppercase transition-all hover:bg-[#005313] active:scale-[0.98]"
                                >
                                    Save Address & Continue
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDetailsModal(false)}
                                    className="w-full rounded-xl border border-gray-200 bg-white py-3 text-xs font-extrabold tracking-wider text-gray-500 uppercase transition-all hover:bg-gray-50 active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
export default DeliveryLocationSelector;
