import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Props passed in by the parent 
interface ProposalsPopupProps {
    tripId: number;
    sqlUserId: number;
    onClose: () => void;
}
// Props for the vote buttons component
interface VoteButtonsProps {
    proposalType: 'song' | 'stop';
    proposalId: number;
    onVote: (value: 'yes' | 'no') => void;
}
// Shape of proposed songs returned from the backend
interface ProposedSong {
    id: number;
    title: string;
    artist: string;
    album_cover?: string;
    release_year?: string;
}
// Shape of proposed stops returned from the backend
interface ProposedStop {
    id: number;
    name: string;
    address: string;
    detour_time: number;
}

export default function ProposalsPopup({ tripId, sqlUserId, onClose }: ProposalsPopupProps) {
    // State for the currently active tab
    const [activeTab, setActiveTab] = useState<'songs' | 'stops'>('songs');
    // State for the proposed songs for the current trip
    const [songs, setSongs] = useState<ProposedSong[]>([]);
    // State for the proposed stops for the current trip
    const [stops, setStops] = useState<ProposedStop[]>([]);
    // State for loading
    const [loading, setLoading] = useState(true);
    // State for user votes
    const [userVotes, setUserVotes] = useState<Record<string, 'yes' | 'no'>>({});
    // State for vote counts
    const [voteCounts, setVoteCounts] = useState({ songVotes: {}, stopVotes: {} } as any);
// Fetch everything for the proposal popup
const fetchData = async () => {

    try {
        // Set the state for loading
        setLoading(true);
        // Call the backedn for the information needed
        const [songsRes, stopsRes, votesRes, countsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trip-proposals/${tripId}/proposed-songs`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trip-proposals/${tripId}/proposed-stops`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/votes/trip/${tripId}/user/${sqlUserId}`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/votes/counts/${tripId}`),
    ]);
    // Conver the users fvotes array into a map for quick lookup
    const votes: Record<string, 'yes' | 'no'> = {};
    votesRes.data.forEach((v: any) => {
    votes[`${v.proposal_type}-${v.proposal_id}`] = v.vote_value;
});
    // Save the songs stops, votes and vote counts in the state
    setSongs(songsRes.data);
    setStops(stopsRes.data);
    setUserVotes(votes);
    setVoteCounts({
    songVotes: Object.fromEntries(countsRes.data.songVotes.map((v: any) => [v.proposal_id, v])),
    stopVotes: Object.fromEntries(countsRes.data.stopVotes.map((v: any) => [v.proposal_id, v])),
    });
    } catch (err) {
        console.error('Failed to fetch proposal data:', err);
    } finally {
        setLoading(false);
    }
    };
// Fetch the popup date when the tripId or sqlUserId changes
useEffect(() => {
    // Ensure these exist before fetching
    if (sqlUserId && tripId) fetchData();
    }, [tripId, sqlUserId]);
// Vote hanlder for proposals
const handleVote = async (proposalType: 'song' | 'stop', proposalId: number, vote: 'yes' | 'no') => {
    // Send the vote to the backend
    try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/votes`, {
        user_id: sqlUserId,
        proposal_type: proposalType,
        proposal_id: proposalId,
        vote_value: vote,
});
// Reload the data after the vote to reflect your cote
await fetchData();
} catch (err) {
    console.error('Vote submission failed:', err);
    }
};
// Hide the vote buttons after voting 
const VoteButtons = ({ proposalType, proposalId, onVote }: VoteButtonsProps) => (
    <div className="flex gap-2">
    <button onClick={() => onVote('yes')} className="border border-green-500 text-green-500 hover:bg-green-600/10 text-xs px-2 py-1 rounded-full">✓</button>
    <button onClick={() => onVote('no')} className="border border-red-500 text-red-500 hover:bg-red-600/10 text-xs px-2 py-1 rounded-full">✕</button>
    </div>
);
// Show the vote on percentage bar
const VoteBar = ({ yes, no }: { yes: number; no: number }) => {
    const total = yes + no;
    const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;
    const noPercent = total > 0 ? 100 - yesPercent : 0;

return (
    <div className="w-32">
        <div className="flex text-xs justify-between mb-1 text-gray-400">
        <span>{yesPercent}%</span><span>{noPercent}%</span>
        </div>
        <div className="w-full h-3 bg-zinc-700 rounded overflow-hidden flex">
        <div className="bg-green-500 h-full" style={{ width: `${yesPercent}%` }}></div>
        <div className="bg-red-500 h-full" style={{ width: `${noPercent}%` }}></div>
        </div>
    </div>
    );
};
// Renders either the songs or the stops depending on what is needed and gets the vote counts for each proposal 
const renderList = (items: any[], type: 'song' | 'stop') => {
    return items.map((item) => {
    // Key used to check if the current user already voted
    const key = `${type}-${item.id}`;
    // value of the vote if already, undefined if not
    const voted = userVotes[key];
    // Grab the vote count for this proposal
    const count = voteCounts[`${type}Votes`][item.id] || { yes_votes: 0, no_votes: 0 };

return (
    <div key={item.id} className="bg-neutral-800 p-3 rounded-lg shadow flex items-center justify-between gap-4">
    {/* Proposal details */}
    <div className="flex-1">
    <p className={type === 'song' ? 'text-emerald-300' : 'text-amber-300'}>{item.title || item.name}</p>
    <p className="text-xs text-gray-400">{type === 'song' ? `${item.artist} • ${item.release_year || 'Unknown'}` : item.address}</p>
    {/* Stops show extra detour info */}
    {type === 'stop' && <p className="text-xs text-gray-500">Detour: ~{Math.round(item.detour_time / 60)} min</p>}
    </div>
    {/* If the user voted, show percentages; otherwise show vote buttons */}
    {voted ? <VoteBar yes={count.yes_votes} no={count.no_votes} /> : (
    <VoteButtons
    proposalType={type}
    proposalId={item.id}
    onVote={(v) => handleVote(type, item.id, v)}
    />
    )}
    </div>
    );
});
};

return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    {/* Modal container */}
    <div className="bg-neutral-900 text-white p-6 rounded-lg w-full max-w-2xl shadow-lg space-y-4 relative">
    {/* Close button */}
    <button onClick={onClose} className="absolute top-2 right-3 text-white text-xl font-bold">&times;</button>
    <h2 className="text-2xl font-semibold text-indigo-300">Trip Proposals</h2>
    {/* Tabs */}
    <div className="flex gap-4">
        {(['songs', 'stops'] as const).map((tab) => (
        <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 rounded font-semibold ${activeTab === tab ? 'bg-indigo-500 text-black' : 'bg-neutral-700'}`}
        >
        {tab === 'songs' ? 'Songs' : 'Stops'}
        </button>
        ))}
    </div>
    {/* Scrollable content */}
    <div className="mt-4 max-h-72 overflow-y-auto space-y-3">
        {loading ? (
        <p className="text-gray-400">Loading proposals...</p>
        ) : activeTab === 'songs' ? (
        songs.length === 0 ? <p className="text-gray-400">No songs proposed yet.</p> : renderList(songs, 'song')
        ) : (
        stops.length === 0 ? <p className="text-gray-400">No stops proposed yet.</p> : renderList(stops, 'stop')
        )}
        </div>
    </div>
    </div>
    );
}
