export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface LocationOption {
    label: string;
    value: {
        lat: number;
        lng: number;
        address: string;
    };
}
export interface MapboxGeocodeFeature {
    geometry: {
        coordinates: [number, number];
    };
    properties: {
        full_address?: string;
        name?: string;
    };
}
/**
 * // Before
setCoords({ lat, lng });
const { lat, lng } = coords;

// After
setCoords({ latitude, longitude });
const { latitude, longitude } = coords;
 */
