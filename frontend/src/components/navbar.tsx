  'use client';

  import React, { useEffect, useState } from 'react';
  import Link from 'next/link';
  import Image from 'next/image';
  import { useRouter } from 'next/navigation';
  import { onAuthStateChanged, signOut } from 'firebase/auth';
  import { auth } from '../../../backend/src/utils/firebaseclient';
  import FriendSearchDropdown from './FriendSearchDropdown';

interface User {
    id: number;
    name: string;
    email: string;
    profile_pic: string;
}

interface TripInvite {
  inviteId: number;
  trip_id: number;
  title: string;
  sender_name: string;
}

interface FriendRequest {
  id: number;
  name: string;
  email: string;
  profile_pic: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sqlUserId, setSqlUserId] = useState<number | null>(null);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [tripInvites, setTripInvites] = useState<TripInvite[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);

    if (currentUser?.uid) {
      try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/firebase/${currentUser.uid}`);
      const data = await res.json();
      setSqlUserId(data.id);
      } catch (err) {
      console.error('Error fetching SQL ID:', err);
      }
    }
    });
    return () => unsubscribe();
  }, []);

  const handleRespondTripInvite = async (inviteId: number, action: 'accepted' | 'declined') => {
    try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trip-invites/${inviteId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user_id: sqlUserId }),
    });
    setTripInvites((prev) => prev.filter((invite) => invite.inviteId !== inviteId));
    } catch (err) {
    console.error(`Failed to ${action} trip invite:`, err);
    }
  };

  const fetchRequests = async () => {
    if (!sqlUserId || !user?.uid) return;

    try {
    console.log('Fetching requests for user:', user.uid);
    const [friendRes, tripRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/requests?user_id=${user.uid}`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trip-invites/pending/${sqlUserId}`)
    ]);

    if (!friendRes.ok || !tripRes.ok) {
      console.error('Response not OK:', { friendRes: friendRes.status, tripRes: tripRes.status });
      throw new Error('Failed to fetch requests');
    }

    const friendsData = await friendRes.json();
    const tripData = await tripRes.json();
    console.log('Friend requests data:', friendsData);
    console.log('Trip invites data:', tripData);
    
    if (!Array.isArray(friendsData)) {
      console.error('Friends data is not an array:', friendsData);
      setPendingRequests([]);
    } else {
      setPendingRequests(friendsData);
    }
    
    if (!Array.isArray(tripData)) {
      console.error('Trip data is not an array:', tripData);
      setTripInvites([]);
    } else {
      setTripInvites(tripData);
    }
    } catch (err) {
    console.error('Failed to fetch pending requests:', err);
    setPendingRequests([]);
    setTripInvites([]);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Set up polling for new requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [sqlUserId, user?.uid]);

  const handleAcceptFriend = async (senderId: number) => {
    if (!sqlUserId) return;
    
    try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/${senderId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: sqlUserId }),
    });

    if (!response.ok) {
      throw new Error('Failed to accept friend request');
    }

    setPendingRequests((prev) => prev.filter((req) => req.id !== senderId));
    } catch (err) {
    console.error('Failed to accept request:', err);
    }
  };

  const handleLogout = async () => {
    try {
    await signOut(auth);
    setUser(null);
    router.push('/');
    } catch (err) {
    console.error('Error logging out:', err);
    }
  };

  const handleProfileMouseEnter = () => {
    if (closeTimeout) {
    clearTimeout(closeTimeout);
    setCloseTimeout(null);
    }
    setIsProfileOpen(true);
  };

  const handleProfileMouseLeave = () => {
    const timeout = setTimeout(() => {
    setIsProfileOpen(false);
    }, 1000);
    setCloseTimeout(timeout);
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimeout) {
    clearTimeout(closeTimeout);
    setCloseTimeout(null);
    }
  };

  const handleDropdownMouseLeave = () => {
    setIsProfileOpen(false);
  };

  const getUserInitials = (email: string) => {
    return email
    .split('@')[0] // Get the part before @
    .toUpperCase()
    .slice(0, 2);
  };

  return (
    <nav className="w-full bg-neutral-800 px-6 py-4 flex justify-between items-center shadow-md z-50">
    <Link href="/" className="text-2xl font-bold text-amber-400">PITSTOP</Link>

    <div className="flex items-center gap-4 relative">
      {sqlUserId && user && (
      <FriendSearchDropdown currentUser={{ uid: user.uid, id: sqlUserId }} />
      )}

      {user ? (
      <>
        <div className="relative">
        <button
          onClick={() => setShowRequests((prev) => !prev)}
          className="text-white hover:text-amber-400 relative"
        >
          🔔
          {(pendingRequests.length + tripInvites.length) > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1">
            {pendingRequests.length + tripInvites.length}
          </span>
          )}
        </button>

        {showRequests && (
          <div className="absolute right-0 mt-2 bg-neutral-700 rounded-md shadow-lg w-80 z-50 max-h-64 overflow-y-auto">
          {pendingRequests.length === 0 && tripInvites.length === 0 ? (
            <p className="text-sm text-white px-4 py-2">No requests</p>
          ) : (
            <>
            {pendingRequests.map((req) => (
              <div
              key={`friend-${req.id}`}
              className="flex justify-between items-center px-4 py-2 hover:bg-neutral-600 text-white"
              >
              <div>
                <p className="font-medium">{req.name}</p>
                <p className="text-xs text-gray-400">{req.email}</p>
              </div>
              <button
                onClick={() => handleAcceptFriend(req.id)}
                className="text-xs bg-amber-400 text-black px-2 py-1 rounded hover:bg-amber-300"
              >
                Accept
              </button>
              </div>
            ))}

            {tripInvites.map((invite) => (
              <div
              key={`trip-${invite.inviteId}`}
              className="flex flex-col px-4 py-2 hover:bg-neutral-600 text-white border-b border-neutral-600"
              >
              <div className="flex justify-between items-center">
                <div>
                <p className="font-medium">Trip Invite: {invite.title}</p>
                <p className="text-xs text-gray-400">from {invite.sender_name}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                onClick={() => handleRespondTripInvite(invite.inviteId, 'accepted')}
                className="text-xs bg-amber-400 text-black px-2 py-1 rounded hover:bg-amber-300"
                >
                Accept
                </button>
                <button
                onClick={() => handleRespondTripInvite(invite.inviteId, 'declined')}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-400"
                >
                Decline
                </button>
              </div>
              </div>
            ))}
            </>
          )}
          </div>
        )}
        </div>

        <div 
        className="relative"
        onMouseEnter={handleProfileMouseEnter}
        onMouseLeave={handleProfileMouseLeave}
        >
        <button className="flex items-center gap-2 hover:bg-neutral-800 rounded-full p-2">
          {user?.photoURL ? (
          <Image
            src={user.photoURL}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full"
          />
          ) : (
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-neutral-900 font-semibold">
            {user?.email ? getUserInitials(user.email) : '?'}
          </div>
          )}
        </button>
        {isProfileOpen && (
          <div 
          className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-lg shadow-lg py-2 z-50"
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          >
          <Link 
            href={`/profile/${sqlUserId}`}
            className="block px-4 py-2 text-sm text-white hover:bg-neutral-700"
          >
            View Profile
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700"
          >
            Logout
          </button>
          </div>
        )}
        </div>
      </>
      ) : (
      <>
        <Link href="/login" className="text-white hover:underline">Login</Link>
        <Link href="/signup" className="text-white hover:underline">Sign Up</Link>
      </>
      )}
    </div>
    </nav>
  );
  }
