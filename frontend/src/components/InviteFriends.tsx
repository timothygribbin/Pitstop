import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Data types to hold the results from the backend
// User shape
interface User {
    id: number;
    name: string;
    email: string;
    profile_pic: string;
}
// Props shape
interface Props {
    tripId: number;
    currentUserId: number;
}
// Possible UI states for invites
type InviteStatus = 'pending' | 'sent' | 'error';

export default function InviteFriends({ tripId, currentUserId }: Props) {
    // State for the current users friends list
    const [friends, setFriends] = useState<User[]>([]);
    // State to hold the invite status
    const [inviteStatus, setInviteStatus] = useState<Record<number, InviteStatus>>({});
    // Load the users friend list when the user Id changes
    useEffect(() => {
    const fetchFriends = async () => {
    try {
        // Call the backend to get the users friends by their API ID
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/friends`, {
        params: { user_id: currentUserId },
        });
        // Set the friends state
        setFriends(res.data);
    } catch (err) {
        console.error('Error fetching friends:', err);
    }
    };
    fetchFriends();
    }, [currentUserId]);
// Friend invite handler
const handleInvite = async (friendId: number) => {
    // Set the invite status state to pending when sent
    setInviteStatus((prev) => ({ ...prev, [friendId]: 'pending' }));

    try {
    // Call the backend to send the invite
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/trip-invites`, {
        trip_id: tripId,
        sender_id: currentUserId,
        receiver_id: friendId,
    });
    // Set the invite status to sent 
    setInviteStatus((prev) => ({ ...prev, [friendId]: 'sent' }));
    } catch (err) {
    console.error('Error sending trip invite:', err);
    setInviteStatus((prev) => ({ ...prev, [friendId]: 'error' }));
    }
};

return (
    <div className="bg-neutral-800 rounded-xl p-6 shadow-lg max-h-80 overflow-y-auto">
    <h2 className="text-2xl font-semibold text-amber-200 mb-4">Invite Friends</h2>
    {/* Empty state if user has no friends */}
    {friends.length === 0 ? (
        <p className="text-amber-100">You have no friends to invite, find some with the search bar!</p>
    ) : (
        <ul className="space-y-2">
        {friends.map((friend) => {
        const status = inviteStatus[friend.id];
        return (
        <li
            key={friend.id}
            className="flex justify-between items-center bg-zinc-800 px-4 py-2 rounded-md text-amber-100 shadow"
        >
            <span>{friend.name}</span>

            <div className="flex items-center gap-2">
            {/* status labels */}
            {status === 'sent' && <span className="text-green-400 text-sm"> Sent</span>}
            {status === 'error' && <span className="text-red-400 text-sm"> Failed</span>}
            {/* Invite button */}
            <button
            onClick={() => handleInvite(friend.id)}
            className="text-sm bg-amber-400 text-black px-3 py-1 rounded hover:bg-amber-300 disabled:opacity-50"
            disabled={status === 'sent' || status === 'pending'}
            >
            {/* Button label changes based on status */}
            {status === 'pending' ? 'Sending...' : status === 'sent' ? 'Invited' : 'Invite'}
            </button>
            </div>
        </li>
        );
        })}
        </ul>
    )}
    </div>
    );
}