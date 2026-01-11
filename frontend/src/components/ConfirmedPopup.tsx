import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Data types for backend results
// Confirmed popup props shape
interface ConfirmedPopupProps {
    tripId: number;
    onClose: () => void;
}
// Confirmed songs shape
interface ConfirmedSong {
    id: number;
    title: string;
    artist: string;
    album_cover?: string;
    release_year?: string;
}
// Confirmed stops shape
interface ConfirmedStop {
    id: number;
    name: string;
    address: string;
    detour_time: number;
}

export default function ConfirmedPopup({ tripId, onClose }: ConfirmedPopupProps) {
    // State to be able to switch between the two active tabs
    const [activeTab, setActiveTab] = useState<'songs' | 'stops'>('songs');
    // State to set the confirmed songs
    const [songs, setSongs] = useState<ConfirmedSong[]>([]);
    // State to set the confirmed stops
    const [stops, setStops] = useState<ConfirmedStop[]>([]);
    // State for loading
    const [loading, setLoading] = useState(true);
    // Grabs confirmed songs and confirmed stops for the current trip
    useEffect(() => {
        const fetchConfirmed = async () => {
        try {
        // Load songs and stops at the same time, could potentially save if we only loaded when one tab was requested but most times people take a look at both so we are sticking with this for now
        const [songsRes, stopsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/confirmed/songs/trip/${tripId}`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/confirmed/stops/trip/${tripId}`),
        ]);
    // Save the results in the state
    setSongs(songsRes.data || []);
    setStops(stopsRes.data || []);
    } catch (err) {
    console.error('Failed to load confirmed data:', err);
    } finally {
    setLoading(false);
    }
};

    fetchConfirmed();
}, [tripId]);

return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    {/* Popup card */}
    <div className="bg-neutral-900 text-white p-6 rounded-lg w-full max-w-2xl shadow-lg space-y-4 relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-2 right-3 text-white text-xl font-bold">
        &times;
        </button>
    {/* Popup title */}
    <h2 className="text-2xl font-semibold text-amber-300">Confirmed Selections</h2>
    {/* Tab buttons */}
    <div className="flex gap-4">
        {(['songs', 'stops'] as const).map((tab) => (
        <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 rounded font-semibold ${
        activeTab === tab ? 'bg-indigo-500 text-black' : 'bg-neutral-700'
        }`}
        >
        {tab === 'songs' ? 'Songs' : 'Stops'}
        </button>
        ))}
    </div>
    {/* Scrollable list container so long lists don’t grow the popup endlessly */}
    <div className="mt-4 max-h-72 overflow-y-auto space-y-3">
        {/* Loading state */}
        {loading ? (
        <p className="text-gray-400">Loading confirmed items...</p>
        ) : activeTab === 'songs' ? (
        songs.length === 0 ? (
        <p className="text-gray-400">No songs confirmed yet.</p>
        ) : (
        songs.map((song) => (
        <div key={song.id} className="bg-neutral-800 p-3 rounded-lg shadow flex items-center gap-4">
            {/* Album cover if it exists */}
            {song.album_cover && <img src={song.album_cover} alt={song.title} className="w-12 h-12 rounded" />}
            {/* Song text info */}
            <div>
            <p className="text-emerald-300 font-semibold">{song.title}</p>
            <p className="text-xs text-gray-400">{song.artist} • {song.release_year || 'Unknown'}</p>
            </div>
        </div>
        ))
        )
        ) : stops.length === 0 ? (
        <p className="text-gray-400">No stops confirmed yet.</p>
        ) : (
        stops.map((stop) => (
        
        <div key={stop.id} className="bg-neutral-800 p-3 rounded-lg shadow">
        <p className="text-amber-300 font-semibold">{stop.name}</p>
        <p className="text-xs text-gray-400">{stop.address}</p>
        <p className="text-xs text-gray-500">Detour: ~{Math.round(Number(stop.detour_time / 60))} min
        </p>
        </div>
        
        ))
    )}
    </div>
    </div>
    </div>
    );
}
