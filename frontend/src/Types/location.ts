export interface Coordinates {
    lat: number;
    lng: number;
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
