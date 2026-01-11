'use client'; // Practically everything is a client component because we use hooks, this was a design flaw I wasn't aware of at the time of designing, so I will have t rebuild one day with this in mind

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../backend/src/utils/firebaseclient';
import axios from 'axios';

export default function CreateTrip() {
  const router = useRouter();
  // Set up the states so we can dynamically read them, these represent the form fields to create the trip
  const [tripName, setTripName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sqlUserId, setSqlUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  // Google Places Autocomplete needs direct access to the DOM <input> elements.
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
// This is an authentication listener, it runs as soon as it mounts and listens to firebase auth state changes, when the user is logged in we grab the SQL user ID 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If a firebase user exists user.uid will be the firebase UID
      if (user?.uid) {
        try {
          // Get the user ID from the backend 
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/firebase/${user.uid}`
          );
          // Store their Sql User ID for later
          setSqlUserId(res.data.id);
        } catch (err) {
          console.error('Error fetching SQL ID:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  // This API key used here is restricted by domain and nothing is on that list, i only open it up to my local host when I am using it for now. Will restrict to only my domain when I am ready to launch
  const handleGoogleLoad = () => {
    if (!window.google) return;
    // Restrict the results to a geo code and restrict the results to the US for now
    const options = {
      types: ['geocode'],
      componentRestrictions: { country: 'us' },
    };
    // Attach autocomplete to the start location input
    if (startInputRef.current) {
      const autoStart = new window.google.maps.places.Autocomplete(startInputRef.current, options);
      // When the input changes read the place and store it
      autoStart.addListener('place_changed', () => {
        const place = autoStart.getPlace();
        setStartLocation(place.formatted_address || place.name || '');
      });
    }
    // Attach autocomplete to the end location input
    if (endInputRef.current) {
      const autoEnd = new window.google.maps.places.Autocomplete(endInputRef.current, options);
       // When the input changes read the place and store it
      autoEnd.addListener('place_changed', () => {
        const place = autoEnd.getPlace();
        setEndLocation(place.formatted_address || place.name || '');
      });
    }
  };

  // Create the trip handler which valdiates that all fields are valid before calling the api
  const handleCreateTrip = async () => {
    // Ensure all fields exist and the sql id is valid
    if (!tripName || !startLocation || !endLocation || !startDate || !endDate || sqlUserId === null) {
      alert('Please fill out all fields.');
      return;
    }
  
    try {
      // Send the trip data from the form to the back end and call the route to create the trip
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/trips`, {
        name: tripName,
        start_location: startLocation,
        end_location: endLocation,
        start_date: startDate,
        end_date: endDate,
        creator_id: sqlUserId,
      });
      // Grab the trip id and navigate to the trip you just created afterwards
      const newTripId = res.data.tripId;
      router.push(`/trip/${newTripId}`);
    } catch (err) {
      console.error('Failed to create trip:', err);
      alert('There was an error creating the trip.');
    }
  };
  // Show a loading screen while loading 
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <p className="text-lg text-amber-300">Loading...</p>
      </main>
    );
  }

  return (
    <>
     {/* Loads Google Maps JS in the browser.*/}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={handleGoogleLoad}
      />
      {/* Main page wrapper */}
      <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4 py-12">
        <div className="bg-neutral-800 rounded-2xl shadow-lg p-8 w-full max-w-2xl space-y-6">
          <h1 className="text-3xl font-bold text-center text-amber-300">Create a New Trip</h1>
          {/* Form grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip Name */}
            <div className="flex flex-col">
              <label className="text-sm text-amber-200 mb-1">Trip Name</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="Spring Break 2025"
                className="bg-zinc-700 text-white placeholder-zinc-400 border border-zinc-600 px-4 py-2 rounded-md focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* Start Location */}
            <div className="flex flex-col">
              <label className="text-sm text-amber-200 mb-1">Start Location</label>
              <input
                type="text"
                ref={startInputRef}
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="New York, NY"
                className="bg-zinc-700 text-white placeholder-zinc-400 border border-zinc-600 px-4 py-2 rounded-md focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* End Location */}
            <div className="flex flex-col">
              <label className="text-sm text-amber-200 mb-1">End Location</label>
              <input
                type="text"
                ref={endInputRef}
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                placeholder="Miami, FL"
                className="bg-zinc-700 text-white placeholder-zinc-400 border border-zinc-600 px-4 py-2 rounded-md focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* Start Date */}
            <div className="flex flex-col">
              <label className="text-sm text-amber-200 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-700 text-white border border-zinc-600 px-4 py-2 rounded-md focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col">
              <label className="text-sm text-amber-200 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-700 text-white border border-zinc-600 px-4 py-2 rounded-md focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
          {/* Submit button to create the trip*/}
          <button
            onClick={handleCreateTrip}
            className="w-full bg-amber-400 hover:bg-amber-300 text-black py-3 px-6 rounded-md font-semibold transition"
          >
            Create Trip
          </button>
        </div>
      </main>
    </>
  );
}