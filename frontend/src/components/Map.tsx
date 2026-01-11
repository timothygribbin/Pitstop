import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Data type for the Map props
interface MapProps {
    start: string;
    end: string;
    onRouteData: (data: {
    encodedPolyline: string;
    durationSeconds: number;
    startCoord: [number, number];
    endCoord: [number, number];
    }) => void;
    
}

export default function Map({ start, end, onRouteData }: MapProps) {
    // Reference to the div that MapLibre renders the map into
    const mapContainerRef = useRef<HTMLDivElement>(null);
    // State to store the route distance to display in the UI
    const [distance, setDistance] = useState<number | null>(null);
    // Convert t0 coordinates using nominatim
    const geocode = async (location: string): Promise<[number, number]> => {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json`);
    const data = await res.json();
    // Check the data is there as expected
    if (!data || data.length === 0) throw new Error(`Could not geocode ${location}`);
    // Return in numbers to return 
    return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
};
    // Runs when the start or end of a route changes
    useEffect(() => {
        let map: maplibregl.Map;

        const load = async () => {
        // Convert the coordinates to geocodes 
        const startCoord = await geocode(start);
        const endCoord = await geocode(end);
        // Call the backend to compute the route between the two geocodes
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/routes/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end }),
        });
        // Extract the route info from the backend exponse
        const { encodedPolyline, duration, distance } = await res.json();
        const decodedPolyline: [number, number][] = decodePolyline(encodedPolyline);
        // Create the map libre map
        map = new maplibregl.Map({
            container: mapContainerRef.current!,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
            center: startCoord,
            zoom: 6,
    });
    // Add UI controls to the map
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    // Start/End Markers
    new maplibregl.Marker({ color: 'green' }).setLngLat(startCoord).addTo(map);
    new maplibregl.Marker({ color: 'red' }).setLngLat(endCoord).addTo(map);
    // Build geoJson for the route, this is what map libre renders
    const geoJson = {
        type: 'FeatureCollection',
        features: [{
        type: 'Feature',
        geometry: {
        type: 'LineString',
        coordinates: decodedPolyline,
        },
        properties: {},
        }],
    };
    // Wait until the map is fully loadied
    map.on('load', () => {
        // Add the route as the source of the map
        map.addSource('route', {
        type: 'geojson',
        data: geoJson,
        });
        // Draw a line on the map
        map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
        'line-join': 'round',
        'line-cap': 'round',
        },
        paint: {
        'line-color': '#1DA1F2',
        'line-width': 4,
        },
    });
        // Zoom the map so the entire route is visible
        const bounds = new maplibregl.LngLatBounds();
        decodedPolyline.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 60 });
    });
    // Convert distance
    setDistance(distance / 1609.34);
    // Send the route info back to the parent component so the popups can use it
    onRouteData({
        encodedPolyline,
        // parse the int because google routes returns something like "123s"
        durationSeconds: parseInt(duration.replace('s', '')),
        startCoord,
        endCoord,
    });
    };

    load().catch(console.error);
    return () => map && map.remove();
    }, [start, end, onRouteData]);

return (

    <div className="relative w-full h-96 rounded-xl">
    {/* Map container div (MapLibre draws into this) */}
    <div ref={mapContainerRef} className="w-full h-full rounded-xl" />
    {/* Distance badge overlay (only shown once distance is available) */}
    {distance && (
        <div className="absolute top-4 left-4 bg-neutral-800 bg-opacity-90 text-white text-sm rounded-lg px-4 py-2 shadow-lg z-10">
        <p><span className="text-amber-300">{distance.toFixed(1)} mi</span></p>
        </div>
    )}
    </div>
    );
    }

// Polyline decoding helper
function decodePolyline(encoded: string): [number, number][] {

    let index = 0, lat = 0, lng = 0, coordinates: [number, number][] = [];

    while (index < encoded.length) {
    // Decode the latitude
    let b, shift = 0, result = 0;
    do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    // Decode the longitude
    shift = result = 0;
    do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    // Polyline stores lat/lng as integer scaled 1e5
    coordinates.push([lng / 1e5, lat / 1e5]);
    }

    return coordinates;
}