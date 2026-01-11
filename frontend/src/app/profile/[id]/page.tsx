'use client';

import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '../../../../../backend/src/utils/firebaseclient';
import { formatDateRange } from '../../../utils/dateFormat';

// Data types to represent the data returned from our backend
// User Shape
interface User {
    id: number;
    name?: string;
    email: string;
    profile_pic?: string;
}
// Trip Shape
interface Trip {
    id: number;
    creator_id: number;
    title: string;
    start_location: string;
    end_location: string;
    start_date: string;
    end_date: string;
}

export default function ProfilePage() {
// Read the user id from the route
    const params = useParams();
    const userId = params.id as string;
    // State to manage the current user's ID and the user itself
    const [sqlUserId, setSqlUserId] = useState<number | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);
    // State to hold the trips and friends of this user
    const [trips, setTrips] = useState<Trip[]>([]);
    const [friends, setFriends] = useState<User[]>([]);

    // Auth listener that run on mount and watches the firebase state and converts the firebase uid to the sql user ID
    // Stores the ID to do permission checks in the UI 
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user?.uid) {
        setFirebaseUser(user);
        // Convert the firebase UID to the internal SQL user ID
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/firebase/${user.uid}`);
        setSqlUserId(res.data.id);
        }
        });
        return () => unsubscribe();
    }, []);
    // Grabs profile data for the user in the URL, using Promise.all so requests run in parallel, runs again when the route changes
    useEffect(() => {
    const fetchProfileData = async () => {
    try {
        // Grab the profiles user info, their trips, and their friends
        const [userRes, tripsRes, friendsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sql/${userId}`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/user/${userId}`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/friends?user_id=${userId}`),
        ]);
        // Store the results in state so the UI renders
        setUser(userRes.data);
        setTrips(tripsRes.data);
        setFriends(friendsRes.data);
    } catch (err) {
        console.error('Error loading profile:', err);
    }
};
    // Only grab the data if there is an ID in the URL
    if (userId) fetchProfileData();
}, [userId]);
// Delete trip handler
const deleteTrip = async (tripId: number) => {
    // Check if the user confirmed the deletion 
    if (!confirm('Are you sure you want to delete this trip?')) return;
        
        try {
        // Call the backend to delete the trip 
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${tripId}`);
        // Remove the deleted trip from the state so it disappears in the UI
        setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
    } catch (err) {
        console.error('Failed to delete trip:', err);
    }
    };
    // This just defaults their profile picture with the initials
    const getUserInitials = (email: string) => email.split('@')[0].toUpperCase().slice(0, 2);
    // Splits the trips into current or past date based on the current data 
    const currentTrips = trips.filter(trip => new Date(trip.end_date) >= new Date());
    const pastTrips = trips.filter(trip => new Date(trip.end_date) < new Date());
    // Show loadinf screen if user isn't loaded yet
    if (!user) {
    return (
        <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
            <p className="text-xl text-amber-300">Loading profile...</p>
        </main>
    );
}

return (
    <main className="min-h-screen bg-neutral-900 text-white px-6 py-12">
    <div className="max-w-5xl mx-auto space-y-12">
    {/* Profile picture/initials + name/email */}
    < div className="flex items-center gap-6">
     {user.profile_pic ? (
    // If user has a profile image URL, show it (they never will currently because there is no option to set it at this time).
      <Image src={user.profile_pic} alt="Profile" width={80} height={80} className="rounded-full border" />
     ) : 
     // Otherwise show initials as a colored circle
     (
      <div className="w-20 h-20 bg-amber-400 rounded-full flex justify-center items-center text-neutral-900 text-2xl font-bold">
       {getUserInitials(user.email)}
      </div>
     )}


     <div>
        {/* Fallback to email prefix */}
      <h1 className="text-3xl font-bold text-amber-300">{user.name || user.email.split('@')[0]}</h1>
      <p className="text-zinc-400">{user.email}</p>
     </div>
    </div>
     {/* Current trips section */}
    <section>
     <h2 className="text-2xl font-semibold text-emerald-300 mb-4">Current Trips</h2>
     <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {currentTrips.map((trip) => (
       <li key={trip.id} className="relative bg-neutral-800 p-4 rounded shadow">
         {/* Clickable trip card that navigates to trip detail page */}
        <Link href={`/trip/${trip.id}`}>
         <h3 className="text-xl font-semibold text-white">{trip.title}</h3>
         <p className="text-sm text-zinc-300">{trip.start_location} → {trip.end_location}</p>
         <p className="text-sm text-zinc-400">{formatDateRange(trip.start_date, trip.end_date)}</p>
        </Link>
        {/* Show delete button only if the logged-in user is the creator */}
        {sqlUserId === trip.creator_id && (
         <button onClick={() => deleteTrip(trip.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-xs px-2 py-1 rounded">
          Delete
         </button>
        )}
       </li>
      ))}
     </ul>
    </section>
    {/* Past trips section */}
    <section>
     <h2 className="text-2xl font-semibold text-amber-300 mb-4">Past Trips</h2>
     <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pastTrips.map((trip) => (
       <li key={trip.id} className="relative bg-neutral-800 p-4 rounded shadow">
        <Link href={`/trip/${trip.id}`}>
         <h3 className="text-xl font-semibold text-white">{trip.title}</h3>
         <p className="text-sm text-zinc-300">{trip.start_location} → {trip.end_location}</p>
         <p className="text-sm text-zinc-400">{formatDateRange(trip.start_date, trip.end_date)}</p>
        </Link>
        {/* Delete button only for creator */}
        {sqlUserId === trip.creator_id && (
         <button
          onClick={() => deleteTrip(trip.id)}
          className="absolute top-2 right-2 bg-red-600 px-2 py-1 text-xs rounded hover:bg-red-700"
         >
          Delete
         </button>
        )}
       </li>
      ))}
     </ul>
    </section>
   </div>
  </main>
 );
}