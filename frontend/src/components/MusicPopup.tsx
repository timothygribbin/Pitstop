'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Data types for the props passed by the parent component and results from calling the backend
interface MusicPopupProps {
  onClose: () => void;
  tripId: number;
  sqlUserId: number;
}
// Data shape of the track
interface Track {
  title: string;
  artist: string;
  albumCover: string;
  year: string;
  spotifyId: string;
}

export default function MusicPopup({ onClose, tripId, sqlUserId }: MusicPopupProps) {
  // State for the current search
  const [query, setQuery] = useState('');
  // List of the tracks returned from the spotify search
  const [results, setResults] = useState<Track[]>([]);
  // State to handle the loading 
  const [isLoading, setIsLoading] = useState(false);
  // Wait for user to stop typing and then a small delay to have the the search results show, should add this to all components
  useEffect(() => {

    const delayDebounce = setTimeout(() => {
      if (query) {
        searchMusic(query);
      } else {
        setResults([]);
      }
    }, 400); // Debounce delay

    return () => clearTimeout(delayDebounce);
  }, [query]);
  // Handles searching the music
  const searchMusic = async (term: string) => {
    setIsLoading(true);
    try {
      // Get the access token to spotify from the backend, then call the search endpoint with the token we get 
      const tokenRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/spotify/token`);
      const accessToken = tokenRes.data.accessToken;

      const res = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: term,
          type: 'track',
          limit: 10,
        },
      });
      // Transform the respinse from spoitfy into a simple track interface
      const tracks = res.data.tracks.items.map((item: any): Track => ({
        title: item.name,
        artist: item.artists.map((a: any) => a.name).join(', '),
        albumCover: item.album.images[0]?.url || '',
        year: item.album.release_date?.slice(0, 4) || 'Unknown',
        spotifyId: item.id,
      }));

      setResults(tracks);
    } catch (err) {
      console.error('Spotify search failed:', err);
    } finally {
      // Set the loading to false after all of it
      setIsLoading(false);
    }
  };
// Handle proposing a song
  const proposeSong = async (track: Track) => {
    try {
      // Call the backend to propose a song with the correct data
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/trip-proposals/propose-song`, {
        trip_id: tripId,
        user_id: sqlUserId,
        title: track.title,
        artist: track.artist,
        album_cover: track.albumCover,
        release_year: track.year,
        spotify_id: track.spotifyId,
      });
      alert(`Proposed "${track.title}"`);
    } catch (err) {
      console.error('Propose song failed:', err);
      alert('Failed to propose song.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      {/* Popup container */}
      <div className="bg-neutral-900 text-white p-6 rounded-lg w-full max-w-md shadow-lg space-y-4 relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-2 right-3 text-white text-xl font-bold">
          &times;
        </button>
        {/* Title */}
        <h2 className="text-2xl font-semibold text-emerald-300">Suggest Music for Your Trip</h2>
        {/* Search input */}
        <div className="space-y-2">
          <label className="block text-sm">Search by song, artist, or genre</label>
          <input
            type="text"
            className="w-full bg-neutral-800 text-white p-2 rounded"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. road trip, Nirvana"
          />
        </div>
        {/* Results list */}
        <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
          {/* Empty state when search returns no results */}
          {isLoading && <p className="text-sm text-gray-400">Searching music...</p>}
          {!isLoading && results.length === 0 && query && (
            <p className="text-sm text-gray-400">No results found.</p>
          )}
          {/* Render search results */}
          {results.map((track, idx) => (
            <div key={idx} className="bg-neutral-800 p-2 rounded shadow flex gap-3">
              {/* Album artwork */}
              <img src={track.albumCover} alt={track.title} className="w-12 h-12 rounded" />
              {/* Track info + action */}
              <div className="flex flex-col">
                <p className="font-medium text-emerald-300">{track.title}</p>
                <p className="text-xs text-gray-400">{track.artist}</p>
                <p className="text-xs text-gray-500">{track.year}</p>
                {/* Propose button */}
                <button
                  className="text-xs bg-emerald-500 text-black px-2 py-1 rounded self-start mt-1"
                  onClick={() => proposeSong(track)}
                >
                  Propose Song
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}