import { Request, Response } from 'express';
import { db } from '../db/db';


export const submitVote = async (req: Request, res: Response) => {
// Extract the necessary fields
 const { user_id, proposal_type, proposal_id, vote_value } = req.body;
// Make sure we have a valid proposal type, and a valude vote value
 if (!['song', 'stop'].includes(proposal_type) || !['yes', 'no'].includes(vote_value)) {
  return res.status(400).json({ error: 'Invalid vote type or value' });
 }
 // Ensure there is a valid user and proposal id
 if (!user_id || !proposal_id){
    return res.status(400).json({error: 'Invalid vote type or value'});
 }
 // Build the table name
 const tableName = proposal_type === 'song' ? 'proposed_songs' : 'proposed_stops';
 const confirmedTable = proposal_type === 'song' ? 'confirmed_songs' : 'confirmed_stops';

 try {
  // Submitthe vote
  const [existingVoteRows]: any = await db.query(
   `SELECT * FROM votes WHERE user_id = ? AND proposal_type = ? AND proposal_id = ?`,
   [user_id, proposal_type, proposal_id]
  );

  const hasVoted = existingVoteRows.length > 0;
  // Added functionality to update your vote but is not currently usable in the UI 
  if (hasVoted) {
    // Update the vote value if they already voted
   await db.query(
    `UPDATE votes SET vote_value = ? WHERE user_id = ? AND proposal_type = ? AND proposal_id = ?`,
    [vote_value, user_id, proposal_type, proposal_id]
   );
   // If not, make a new vote
  } else {
   await db.query(
    `INSERT INTO votes (user_id, proposal_type, proposal_id, vote_value)
     VALUES (?, ?, ?, ?)`,
    [user_id, proposal_type, proposal_id, vote_value]
   );
  }

  // Check for proposal trip and participant count
  const [[tripRow]]: any = await db.query(`SELECT trip_id FROM ${tableName} WHERE id = ?`, [proposal_id]);
  const tripId = tripRow?.trip_id;
  // Duct tape ways to get number of participants and total votes and the operations, on the list of things to fix
  const [[{ total_participants }]]: any = await db.query(
   `SELECT COUNT(*) AS total_participants FROM trip_participants WHERE trip_id = ?`,
   [tripId]
  );

  const [[{ total_votes }]]: any = await db.query(
   `SELECT COUNT(*) AS total_votes FROM votes WHERE proposal_type = ? AND proposal_id = ?`,
   [proposal_type, proposal_id]
  );
  // Get the number of yes and no votes
  if (total_votes >= total_participants && total_participants > 0) {
   const [[{ yes_votes, no_votes }]]: any = await db.query(
    `SELECT 
      SUM(vote_value = 'yes') AS yes_votes,
      SUM(vote_value = 'no') AS no_votes
     FROM votes
     WHERE proposal_type = ? AND proposal_id = ?`,
    [proposal_type, proposal_id]
   );
   // I think this logic is actually wrong looking at it right now but I will get to that soon, making a list as I go through this
   if (yes_votes > no_votes) {
    // If it's a song
    if (proposal_type === 'song') {
     const [[song]]: any = await db.query(`SELECT * FROM proposed_songs WHERE id = ?`, [proposal_id]);
     // Insert into confirmed songs
     await db.query(
      `INSERT INTO confirmed_songs (trip_id, title, artist, album_cover_url, release_year, spotify_track_id, added_by, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
       song.trip_id,
       song.title,
       song.artist,
       song.album_cover, 
       song.release_year,
       song.spotify_id, 
       song.user_id  
      ]
     );
     // If it's a stop
    } else {
     const [[stop]]: any = await db.query(`SELECT * FROM proposed_stops WHERE id = ?`, [proposal_id]);
     // Insert into confirmed stops
     await db.query(
      `INSERT INTO confirmed_stops (trip_id, name, address, detour_time, added_by)
       VALUES (?, ?, ?, ?, ?)`,
      [stop.trip_id, stop.name, stop.address, stop.detour_time, stop.user_id]
    );
    }
    }
   // Expire the proposal
    await db.query(`UPDATE ${tableName} SET expires_at = NOW() WHERE id = ?`, [proposal_id]);
    }

    res.status(hasVoted ? 200 : 201).json({
    message: hasVoted ? 'Vote updated' : 'Vote submitted',
    });

    } catch (err) {
    onsole.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to submit vote' });
    }
};

export const getVoteCounts = async (req: Request, res: Response) => { 
// Extract the trip Id from the request parameters
const { tripId } = req.params;
if(!tripId) return res.status(400).json({error: "Error identifying trip"})
// Select the proposals and add up the vote counts for songs
    try {
    const [songVotes]: any = await db.query(
    `SELECT proposal_id, 
    CAST(SUM(vote_value = 'yes') AS UNSIGNED) AS yes_votes,
    CAST(SUM(vote_value = 'no') AS UNSIGNED) AS no_votes
    FROM votes
    WHERE proposal_type = 'song' AND proposal_id IN (
    SELECT id FROM proposed_songs WHERE trip_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    )
    GROUP BY proposal_id`,
    [tripId]
    );
  // Do the same for stops
    const [stopVotes]: any = await db.query(
    `SELECT proposal_id, 
    CAST(SUM(vote_value = 'yes') AS UNSIGNED) AS yes_votes,
    CAST(SUM(vote_value = 'no') AS UNSIGNED) AS no_votes
    FROM votes
    WHERE proposal_type = 'stop' AND proposal_id IN (
    SELECT id FROM proposed_stops WHERE trip_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    )
    GROUP BY proposal_id`,
    [tripId]
    );

    res.json({ songVotes, stopVotes });
    } catch (err) {
    console.error('Error fetching vote counts:', err);
    res.status(500).json({ error: 'Failed to fetch vote counts' });
    }
};

export const getUserVotes = async (req: Request, res: Response) => {
    // Extract the trip and user id from the request parameters
    const { tripId, userId } = req.params;
    // Grab all active votes for a user for a specific trip 
    // Votes are stored so we join conditionally against proposed songs or proposed stops depending on the proposal type
    // Left joins are used because each vote belongs to exactly one proposal type
    try {
    const [userVotes]: any = await db.query(
    `SELECT v.proposal_type, v.proposal_id, v.vote_value
    FROM votes v
    LEFT JOIN proposed_songs ps ON v.proposal_type = 'song' AND v.proposal_id = ps.id
    LEFT JOIN proposed_stops pt ON v.proposal_type = 'stop' AND v.proposal_id = pt.id
    WHERE v.user_id = ? AND (
        (v.proposal_type = 'song' AND ps.trip_id = ? AND (ps.expires_at IS NULL OR ps.expires_at > NOW()))
        OR
        (v.proposal_type = 'stop' AND pt.trip_id = ? AND (pt.expires_at IS NULL OR pt.expires_at > NOW()))
    )`,
    [userId, tripId, tripId]
    );

    res.json(userVotes);
    } catch (err) {
    console.error('Error fetching user votes:', err);
    res.status(500).json({ error: 'Failed to fetch user votes' });
    }
};