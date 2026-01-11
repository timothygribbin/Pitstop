'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../../../../../backend/src/utils/firebaseclient';
import { formatDateRange } from '../../../utils/dateFormat';

import InviteFriends from '../../../components/InviteFriends';
import StopSearchPopup from '../../../components/StopSearchPopup';
import MusicPopup from '../../../components/MusicPopup';
import ProposalsPopup from '../../../components/ProposalsPopup';
import ConfirmedPopup from '../../../components/ConfirmedPopup';
import ConfirmedPreview from '../../../components/ConfirmedPreview';
import ExpensesPreview from '../../../components/ExpensesPreview';
import ExpensesPopup from '../../../components/ExpensesPopup';


const Map = dynamic(() => import('../../../components/Map'), { ssr: false });
// Data types to store results from the backend for trips and participants
// Trip Shape
interface Trip {
  id: number;
  title: string;
  start_location: string;
  end_location: string;
  start_date: string;
  end_date: string;
  creator_id: number;
}
// Participant Shape
interface Participant {
  id: number;
  name: string;
  email: string;
  profile_pic: string;
  role: 'creator' | 'member';
}

export default function TripPage() {
  const { id } = useParams();
  // Grab the trip ID from the url
  const tripId = parseInt(id as string, 10);
  // State for trip drtails
  const [trip, setTrip] = useState<Trip | null>(null);
  // State for the list of users participating in the trip
  const [participants, setParticipants] = useState<Participant[]>([]);
  // State for logged in user's SQL id 
  const [sqlUserId, setSqlUserId] = useState<number | null>(null);
  // State for loading time and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for popups 
  const [showStopPopup, setShowStopPopup] = useState(false);
  const [showMusicPopup, setShowMusicPopup] = useState(false);
  const [showProposalsPopup, setShowProposalsPopup] = useState(false);
  const [showConfirmedPopup, setShowConfirmedPopup] = useState(false);
  const [showExpensesPopup, setShowExpensesPopup] = useState(false);
  // Popupdate will hold the route information needed for the different pop ups
  const [popupData, setPopupData] = useState<{
    encodedPolyline: string;
    durationSeconds: number;
    startCoord: [number, number];
    endCoord: [number, number];
  } | null>(null);

  //Callback that Map can call to pass computed route data up to this page
  const handleRouteData = useCallback((data: typeof popupData) => {
    setPopupData(data);
  }, []);
  // This fetches trips and participants when the trip id changes
  useEffect(() => {
    //Make sure the trip Id is a number
    if (isNaN(tripId)) {
      setError('Invalid trip ID');
      setLoading(false);
      return;
  }

  const fetchData = async () => {
  try {
    // Load the trip details and participants at the same time
    const [tripRes, participantsRes] = await Promise.all([
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${tripId}`),
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${tripId}/participants`),
  ]);
    // Manage the state for the trip and the participants
    setTrip(tripRes.data);
    setParticipants(participantsRes.data);
  } catch (err) {
    console.error('Error loading trip:', err);
    setError('Failed to load trip data.');
  } finally {
    // Stop showing the loading screen either way
    setLoading(false);
  }
  };

  fetchData();
}, [tripId]);
  // Listens for sign in auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
    // Check if the user has a uid
    if (user?.uid) {
      try {
        // Call the backend to start or stop a session
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/firebase/${user.uid}`);
        setSqlUserId(res.data.id);
      } catch (err) {
        console.error('Failed to fetch SQL user ID:', err);
      }
      }
  });

  return () => unsubscribe();
}, []);

// Helper to show initials as a fallback avatar when profile_pic is missing (always)
const getUserInitials = (email: string | undefined) => {
  return email?.split('@')[0].toUpperCase().slice(0, 2) || '?';
  };
  // Loading UI while trip is being fetched
  if (loading || !trip) {
  return (
    <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
    <p className="text-xl text-amber-300">Loading trip...</p>
    </main>
  );
}

  // Error UI if the fetch failed or tripId was invalid.
  if (error) {
  return (
    <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
    <p className="text-xl text-red-400">{error}</p>
    </main>
  );
}

  return (
  <main className="min-h-screen bg-neutral-900 text-white px-6 py-12">
  <div className="max-w-4xl mx-auto space-y-10">
    {/* Trip Header */}
    <div className="bg-neutral-800 p-6 rounded-xl shadow space-y-3">
    <h1 className="text-3xl font-bold text-amber-300">{trip.title}</h1>
    <p className="text-zinc-400">{trip.start_location} → {trip.end_location}</p>
    <p className="text-zinc-500">{formatDateRange(trip.start_date, trip.end_date)}</p>
    </div>

    {/* Map Section */}
    <section className="bg-neutral-800 p-6 rounded-xl shadow">
    <h2 className="text-2xl font-semibold text-amber-300 mb-4">Route</h2>
    <div className="w-full h-96 rounded-lg overflow-hidden">
      <Map start={trip.start_location} end={trip.end_location} onRouteData={handleRouteData} />
    </div>
    </section>

    {/* Buttons Section */}
    <section className="bg-neutral-800 p-6 rounded-xl shadow space-y-4">
    <h2 className="text-2xl font-semibold text-amber-300">Plan Stops</h2>
    <div className="flex flex-col sm:flex-row gap-4">
      <button onClick={() => setShowStopPopup(true)} className="flex-1 bg-red-400 hover:bg-red-600 text-neutral-900 font-semibold py-2 px-4 rounded">
          Search Stops Along Route
      </button>
      <button onClick={() => setShowMusicPopup(true)} className="flex-1 bg-yellow-300 hover:bg-yellow-600 text-neutral-900 font-semibold py-2 px-4 rounded">
        Search for Music
      </button>
      <button onClick={() => setShowProposalsPopup(true)} className="flex-1 bg-green-400 hover:bg-green-700 text-neutral-900 font-semibold py-2 px-4 rounded">
        View Proposals
      </button>
      </div>
    </section>

    {/* Confirmed Songs/Stops Preview */}
    <section className="bg-neutral-800 p-6 rounded-xl shadow space-y-4">
    <h2 className="text-2xl font-semibold text-amber-300">Confirmed Selections</h2>
    <ConfirmedPreview tripId={tripId} onExpand={() => setShowConfirmedPopup(true)} />
    </section>


    <section className="bg-neutral-800 p-6 rounded-xl shadow space-y-4">
      <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-amber-300">Expenses</h2>
      </div>
    {sqlUserId !== null && (
      <ExpensesPreview
      tripId={tripId}
      sqlUserId={sqlUserId}
      onOpenPopup={() => setShowExpensesPopup(true)}
    />
    )}
    </section>

    {/* Participants */}
    <section className="bg-neutral-800 p-6 rounded-xl shadow space-y-4">
    <h2 className="text-2xl font-semibold text-amber-300">Participants</h2>
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {participants.map((p) => (
      <li key={p.id} className="bg-zinc-700 p-3 rounded-lg flex flex-col items-center">
        {p.profile_pic ? (
        <Image
          src={p.profile_pic}
          alt={p.name || p.email}
          width={56}
          height={56}
          className="rounded-full border border-white"
        />
        ) : (
        <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-neutral-900 text-lg font-semibold border border-white">
          {getUserInitials(p.email)}
        </div>
        )}
        <p className="mt-2 font-medium">{p.name || p.email}</p>
        <p className="text-xs text-gray-400">{p.role}</p>
        </li>
      ))}
    </ul>
    </section>

    {/* Invite Friends */}
    {sqlUserId !== null && (
    <section className="bg-neutral-800 p-6 rounded-xl shadow space-y-2">
      <h2 className="text-xl font-semibold text-amber-300">Invite Friends</h2>
      <InviteFriends currentUserId={sqlUserId} tripId={tripId} />
    </section>
    )}
  </div>

   {/* Popups */}
  {showStopPopup && popupData && (
    <StopSearchPopup
    tripId={tripId}
    sqlUserId={sqlUserId!}
    onClose={() => setShowStopPopup(false)}
    startCoord={popupData.startCoord}
    endCoord={popupData.endCoord}
    originalDuration={popupData.durationSeconds}
    encodedPolyline={popupData.encodedPolyline}
    />
  )}
  {showMusicPopup && (
    <MusicPopup
    tripId={tripId}
    sqlUserId={sqlUserId!}
    onClose={() => setShowMusicPopup(false)}
    />
  )}
  {showProposalsPopup && (
    <ProposalsPopup
    tripId={tripId}
    sqlUserId={sqlUserId!}
    onClose={() => setShowProposalsPopup(false)}
    />
  )}
  {showConfirmedPopup && (
    <ConfirmedPopup
    tripId={tripId}
    onClose={() => setShowConfirmedPopup(false)}
    />
  )}

  {showExpensesPopup && sqlUserId !== null && (
    <ExpensesPopup
    tripId={tripId}
    sqlUserId={sqlUserId}
    onClose={() => setShowExpensesPopup(false)}
    />
  )}
  </main>
);
}
