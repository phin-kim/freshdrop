import { booleanPointInPolygon, point, polygon } from '@turf/turf';

// Bounding polygon encompassing Machakos Town, extending from Katoloni (West/Southwest)
// to Kathayoni (East/Northeast) as the furthest borders.
const machakosBoundary = polygon([
    [
        [37.23, -1.495], // Northwest boundary
        [37.31, -1.495], // Northeast boundary
        [37.31, -1.565], // Southeast boundary (spanning out past Kathayoni)
        [37.23, -1.565], // Southwest boundary (spanning out past Katoloni)
        [37.23, -1.495], // Closing point of the polygon ring
    ],
]);

const isLocationServiceable = (lng: number, lat: number): boolean => {
    try {
        const userPoint = point([lng, lat]);
        return booleanPointInPolygon(userPoint, machakosBoundary);
    } catch {
        return false;
    }
};

export default isLocationServiceable;
