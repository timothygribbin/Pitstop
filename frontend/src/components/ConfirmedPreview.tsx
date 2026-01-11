import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Data types to hold the returned values from the backend
// ConfirmedPreviewProps shape
interface ConfirmedPreviewProps {
    tripId: number;
    onExpand: () => void;
}
// Confirmed song shape
interface ConfirmedSong {
    id: number;
    title: string;
    artist: string;
    album_cover?: string;
    release_year?: string;
}
// Confirmed stop shape
interface ConfirmedStop {
    id: number;
    name: string;
    address: string;
    detour_time: number;
    added_by: number;
}

export default function ConfirmedPreview({ tripId, onExpand }: ConfirmedPreviewProps) {
    // States to swtich through the tabs
    const [activeTab, setActiveTab] = useState<'songs' | 'stops'>('songs');
    // Confirmed songs and stops 
    const [songs, setSongs] = useState<ConfirmedSong[]>([]);
    const [stops, setStops] = useState<ConfirmedStop[]>([]);
    // Grab the confirmed stops and songs to show them in the preview
    useEffect(() => {
        const fetchConfirmed = async () => {
        try {
            // Get the confirmed songs or stops from the specific trip
            const [songsRes, stopsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/confirmed/songs/trip/${tripId}`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/confirmed/stops/trip/${tripId}`)
            ]);
            // Save the songs and stops in state
            setSongs(songsRes.data || []);
            setStops(stopsRes.data || []);
        } catch (err) {
            console.error('Failed to fetch confirmed items:', err);
        }
};

    fetchConfirmed();
}, [tripId]);

    const previewItems = activeTab === 'songs' ? songs.slice(0, 3) : stops.slice(0, 3);

    return (
    <section className="bg-neutral-800 p-6 rounded-xl shadow space-y-4">
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
    <div className="space-y-3">
    {previewItems.length === 0 ? (
        <p className="text-gray-400 text-sm">No confirmed {activeTab} yet.</p>
        ) : (
        previewItems.map((item) => (
        <div
        key={item.id}
        className="bg-zinc-700 p-3 rounded flex items-center gap-4"
        >
        {activeTab === 'songs' ? (
        <>
            {'album_cover' in item && item.album_cover && (
            <img src={item.album_cover} alt={item.title} className="w-12 h-12 rounded" />
            )}
            <div>
            <p className="text-emerald-300 font-semibold">{item.title}</p>
            <p className="text-xs text-gray-400">{item.artist} • {item.release_year}</p>
            </div>
        </>
        ) : (
            <>
            <div>
            <p className="text-amber-300 font-semibold">{item.name}</p>
            <p className="text-xs text-gray-400">{item.address}</p>
            <p className="text-xs text-gray-500">Detour: ~{Math.abs(Math.round(Number(item.detour_time / 60)))} min</p>
            </div>
        </>
        )}
        </div>
        ))
    )}
    </div>
    <div className="pt-2 text-right">
        <button
        onClick={onExpand}
        className="text-sm text-indigo-300 hover:underline"
        >
        View All
        </button>
    </div>
    </section>
    );
}
