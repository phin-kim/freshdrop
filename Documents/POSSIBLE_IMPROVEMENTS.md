# Geofence.ts

- Your search bbox is much bigger than your polygons. OPERATIONAL_BBOX covers Ruiru, Athi River, Kitengela and everything between, so Mapbox will suggest places your function then rejects. Mapbox accepts only one bbox per request, so query each area separately and merge.

```ts
// serviceArea.ts
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';

const machakosBoundary = polygon([
    [
        [37.23, -1.495],
        [37.31, -1.495],
        [37.31, -1.565],
        [37.23, -1.565],
        [37.23, -1.495],
    ],
]);
const jujaBoundary = polygon([
    [
        [37.0, -1.15],
        [37.05, -1.15],
        [37.05, -1.08],
        [37.0, -1.08],
        [37.0, -1.15],
    ],
]);

// bbox() returns [minLon, minLat, maxLon, maxLat], which is what Mapbox expects
export const SERVICE_BBOXES = [bbox(jujaBoundary), bbox(machakosBoundary)].map(
    (b) => b.join(',')
);

const isLocationServiceable = (lng: number, lat: number): boolean => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
    const p = point([lng, lat]);
    return (
        booleanPointInPolygon(p, machakosBoundary) ||
        booleanPointInPolygon(p, jujaBoundary)
    );
};

export default isLocationServiceable;
```

# Maps.tsx

```tsx
// clean instance with no global headers or credentials
const mapboxClient = axios.create();

const searchBbox = async (
    q: string,
    bboxStr: string
): Promise<MapboxGeocodeFeature[]> => {
    try {
        const res = await mapboxClient.get(
            'https://api.mapbox.com/search/geocode/v6/forward',
            {
                params: {
                    q,
                    country: 'ke',
                    bbox: bboxStr,
                    limit: 5,
                    access_token: MAPBOX_ACCESS_TOKEN,
                    ...(coordsRef.current && {
                        proximity: `${coordsRef.current.longitude},${coordsRef.current.latitude}`,
                    }),
                },
            }
        );
        return res.data.features ?? [];
    } catch (error) {
        log.error('Mapbox geocode failed', {
            data: {
                bbox: bboxStr,
                status: (error as any)?.response?.status,
                error,
            },
        });
        return [];
    }
};

const fetchSuggestions = async (
    inputValue: string,
    callback: (options: LocationOption[]) => void
): Promise<void> => {
    if (!inputValue.trim()) return callback([]);

    const results = (
        await Promise.all(SERVICE_BBOXES.map((b) => searchBbox(inputValue, b)))
    ).flat();

    const seen = new Set<string>();
    const options: LocationOption[] = results
        .filter((f) => {
            const [lng, lat] = f.geometry.coordinates;
            const id = f.properties.mapbox_id ?? `${lng},${lat}`;
            if (seen.has(id) || !isLocationServiceable(lng, lat)) return false;
            seen.add(id);
            return true;
        })
        .slice(0, 5)
        .map((f) => {
            const address =
                f.properties.full_address ||
                f.properties.name ||
                'Unknown Location';
            return {
                label: address,
                value: {
                    lng: f.geometry.coordinates[0],
                    lat: f.geometry.coordinates[1],
                    address,
                },
            };
        });

    callback(options);
};
```

**_NB_**

- Your Juja box is only 5 km by 8 km. If users near Gachororo or Kalimoni can’t search, widen it to about 36.97 to 37.08.
