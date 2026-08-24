import { booleanPointInPolygon, point, polygon } from '@turf/turf';

const jujaBoundary = polygon([
    [
        [37.0, -1.15],
        [37.05, -1.15],
        [37.05, -1.08],
        [37.0, -1.08],
        [37.0, -1.15],
    ],
]);
const isLocationServiceable = (lng: number, lat: number): boolean => {
    try {
        const userPoint = point([lng, lat]);
        return booleanPointInPolygon(userPoint, jujaBoundary);
    } catch {
        return false;
    }
};
export default isLocationServiceable;
