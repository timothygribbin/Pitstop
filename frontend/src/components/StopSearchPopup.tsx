/// <reference types="@types/google.maps" />

import React, { useEffect, useRef, useState, useMemo } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import { Loader } from '@googlemaps/js-api-loader';

// Prop passed from the trip page
interface StopSearchPopupProps {
    onClose: () => void;
    startCoord: [number, number];
    endCoord: [number, number];
    originalDuration: number;
    encodedPolyline: string;
    tripId: number;
    sqlUserId: number;
}
// Categories to findthings without serching specifically
const categories = [
    { label: 'Restaurants', value: 'restaurant' },
    { label: 'Cafés', value: 'cafe' },
    { label: 'Grocery Stores', value: 'supermarket' },
    { label: 'Gas Stations', value: 'gas_station' },
    { label: 'Hotels', value: 'lodging' },
    { label: 'Banks & ATMs', value: 'bank' },
    { label: 'Parks & Nature', value: 'park' },
    { label: 'Tourist Attractions', value: 'tourist_attraction' },
];

export default function StopSearchPopup({
    onClose,
    startCoord,
    endCoord,
    originalDuration,
    encodedPolyline,
    tripId,
    sqlUserId,
}: StopSearchPopupProps) {
    // State for the current selected category
    const [selectedCategory, setSelectedCategory] = useState('');
    // State for the current search
    const [query, setQuery] = useState('');
    // State for the results returned
    const [results, setResults] = useState<any[]>([]);
    // State for loading
    const [isLoading, setIsLoading] = useState(false);
    // This prevents the Google Maps JS from being loaded multiple times
    const mapsLoaded = useRef(false);
// Search with the debounce we also had on the songs popup
const searchStops = useMemo(() =>
    debounce(async () => {
        // Don't search if there is no input or route
        if ((!selectedCategory && !query) || !encodedPolyline) return;
        setIsLoading(true);
        setResults([]);
    
    try {
        // Load the api so it is ready to be called
        const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['places'],
    });

    if (!mapsLoaded.current) {
        await loader.load();
        mapsLoaded.current = true;
    }
    // Call the backend with the polyline and filter by search or category
    const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stops/search`,
        {
        encodedPolyline,
        query,
        category: selectedCategory,
        }
    );
    // For each returned result compute the difference between the route total vs original duration to get the detour time
    const enriched = await Promise.all(
        (res.data.places || []).map(async (place: any) => {
        if (!place.location) return null;

        const coords = {
        lat: place.location.latitude,
        lng: place.location.longitude,
    };
    // Calculate the detour using the irections API
    const detourTime = await new Promise<number>((resolve) => {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
        {
            origin: { lat: startCoord[1], lng: startCoord[0] },
            destination: { lat: endCoord[1], lng: endCoord[0] },
            waypoints: [{ location: coords }],
            travelMode: google.maps.TravelMode.DRIVING,
        },
            (res, status) => {
                if (status === 'OK' && res?.routes[0]) {
                const total = res.routes[0].legs.reduce(
                (sum, leg) => sum + (leg.duration?.value || 0),
                0
            );
            // Extra time added by the detour
            resolve(total - originalDuration);
            // Defaults to 0
            } else {
                resolve(0);
            }
        }
    );
});

return {
        name: place.displayName?.text || 'Unnamed',
        address: place.formattedAddress,
        detourTime,
        };
    })
);
    // Remove the null values and sort by the shortest detour
    setResults(
        enriched.filter(Boolean).sort((a: any, b: any) => a.detourTime - b.detourTime)
    );
    } catch (err) {
        console.error('Stop search failed:', err);
    } finally {
        setIsLoading(false);
    }
    }   , 600),
    [encodedPolyline, query, selectedCategory]
);
// Trigger the search when the query or category changes
useEffect(() => {
    searchStops();
    return () => searchStops.cancel();
    }, [query, selectedCategory]);
// Handle proposing a stop
const proposeStop = async (place: any) => {
    try {
        // Call the backend to propose the stop
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/trip-proposals/propose-stop`, {
        trip_id: tripId,
        user_id: sqlUserId,
        name: place.name,
        address: place.address,
        detour_time: place.detourTime,
    });
    alert(`Proposed: ${place.name}`);
    } catch (err) {
    console.error('Failed to propose stop:', err);
    alert('Failed to suggest stop.');
    }
};

return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    {/* Modal container */}
    <div className="bg-neutral-900 text-white p-6 rounded-lg w-full max-w-md shadow-lg space-y-4 relative">
    {/* Close button */}
    <button onClick={onClose} className="absolute top-2 right-3 text-white text-xl font-bold">
    &times;
    </button>

    <h2 className="text-2xl font-semibold text-amber-300">Find Stops Along Your Route</h2>
    {/* Search inputs */}
    <div className="space-y-2">
    <label className="block text-sm">Search by name</label>
    <input
    type="text"
    className="w-full bg-neutral-800 text-white p-2 rounded"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="e.g. Starbucks"
    />

    <label className="block text-sm mt-4">Or select a category</label>
    <select
        className="w-full bg-neutral-800 text-white p-2 rounded"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        >
        <option value="">Choose a category</option>
        {categories.map((cat) => (
        <option key={cat.value} value={cat.value}>
        {cat.label}
        </option>
        ))}
        </select>
    </div>
    {/* Results list */}
    <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
        {isLoading && <p className="text-sm text-gray-400">Searching for stops...</p>}
        {!isLoading && results.length === 0 && (selectedCategory || query) && (
        <p className="text-sm text-gray-400">No results found.</p>
        )}
        {results.map((place, idx) => (
        <div key={idx} className="bg-neutral-800 p-2 rounded shadow flex flex-col gap-1">
        <p className="font-medium text-amber-300">{place.name}</p>
        <p className="text-xs text-gray-400">{place.address}</p>
        <p className="text-xs text-zinc-400">
        ⏱️ ~{place.detourTime ? Math.abs(Math.round(place.detourTime / 60)) : 0} min detour
        </p>
        <button
        className="text-xs bg-amber-500 text-black px-2 py-1 rounded self-start mt-1"
        onClick={() => proposeStop(place)}
        >
        Suggest Stop
        </button>
        </div>
        ))}
    </div>
    </div>
    </div>
    );
}