"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
//Data types to take the backend data
// User data shape
interface User {
    id: number;
    name: string;
    email: string;
    profile_pic: string;
}
// Current user data shape (both IDs)
interface CurrentUser {
    uid: string; // Firebase UID
    id: number; // SQL ID
}

export default function FriendSearchDropdown({ currentUser }: { currentUser: CurrentUser }) {
    // State for the current search input
    const [query, setQuery] = useState('');
    // State for the results
    const [results, setResults] = useState<User[]>([]);
    // Controls the visibility of the dropdown
    const [showDropdown, setShowDropdown] = useState(false);
    // Used to detect clicks outside of the dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);
    // Build the base URL
    const API_BASE = process.env.NEXT_PUBLIC_API_URL;
    // Close the dropdown menu when someone clicks outside of it
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
        // If click is not inside the component we hide the drop down in the UI
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setShowDropdown(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
// This runs wheneber there is input in the search bar 
const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update the query state
    setQuery(value);
    // Require 2 characters and a user signed in
    if (value.trim().length < 2 || !currentUser?.uid) {
        setResults([]);
        return;
    }
    
    try {
        // Call the backend to get the search results
        const response = await axios.get(`${API_BASE}/api/users/search`, {
            params: {
            q: value,
            currentUserId: currentUser.uid,
            },
    });
    // Set the results and make the drop down menu visible
    setResults(response.data);
    setShowDropdown(true);
    } catch (err) {
    console.error('Error fetching users:', err);
    }
    };
// Handle sending a friend request
const handleSendRequest = async (receiverId: number) => {
    // Call the backend to send the friend request
    try {
        const response = await axios.post(`${API_BASE}/api/friends/${receiverId}`, {
        sender_id: currentUser.id, 
        receiver_id: receiverId
    });
    // Confirm the request was sent
    if (response.status === 201) {
        alert('Friend request sent!');
        setQuery('');
        setResults([]);
        setShowDropdown(false);
        
        // Trigger a custom event to refresh requests
        window.dispatchEvent(new CustomEvent('refreshRequests'));
    }
    } catch (err: any) {
    if (err.response?.status === 409) {
        alert('Friend request already sent.');
    } else {
        console.error('Error sending request:', err);
        alert('Failed to send request.');
    }
    }
    };

    return (
    <div className="relative" ref={dropdownRef}>
    {/* Search input */}
    <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search friends..."
        className="px-3 py-1 rounded-md bg-zinc-700 text-white focus:outline-none focus:ring focus:ring-amber-400"
    />
    {/* Results dropdown (only shown when enabled and results exist) */}
    {showDropdown && results.length > 0 && (
        <div className="absolute bg-neutral-800 border border-zinc-600 rounded-md mt-2 w-64 max-h-60 overflow-y-auto z-50">
        {results.map((user) => (
        <div
        key={user.id}
        className="px-4 py-2 text-white hover:bg-neutral-700 flex justify-between items-center"
        >
        {/* User info */}
        <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
        </div>
        {/* Send friend request */}
        <button
            onClick={() => handleSendRequest(user.id)}
            className="text-sm bg-amber-400 text-black px-2 py-1 rounded hover:bg-amber-300"
        >
            Add
        </button>
        </div>
        ))}
        </div>
    )}
    </div>
    );
    }