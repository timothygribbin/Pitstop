
import { Request, Response } from 'express';
import { db } from '../db/db';

export const sendTripInvite = async (req: Request, res: Response) => {
  // Extract the necessary fields from the request body
  const { trip_id, sender_id, receiver_id } = req.body;
  // Ensure all 3 ID's exist
  if (!trip_id || !sender_id || !receiver_id) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    // Insert the invite into the invites table
    await db.query(
      'INSERT INTO trip_invites (trip_id, sender_id, receiver_id, status) VALUES (?, ?, ?, ?)',
      [trip_id, sender_id, receiver_id, 'pending']
    );
    res.status(201).json({ message: 'Invite sent' });
    // Catch any error
  } catch (err) {
    console.error('Error sending invite:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPendingTripInvites = async (req: Request, res: Response) => {
  // Extract the user ID from the request params
  const userId = parseInt(req.params.userId);
  // Ensure userId exists
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });
  // Get all the pending trip invites for the current user. We join related tables to return human-readable data (trip title, sender name) in a single query, avoiding additional lookups on the frontend.
  try {
    const [rows]: any = await db.query(
      `SELECT ti.id AS inviteId, ti.trip_id, t.title, u.name AS sender_name
       FROM trip_invites ti
       JOIN trips t ON ti.trip_id = t.id
       JOIN users u ON ti.sender_id = u.id
       WHERE ti.receiver_id = ? AND ti.status = 'pending'`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const respondToTripInvite = async (req: Request, res: Response) => {
    // Extract the necessary fields from the ID
    const inviteId = parseInt(req.params.inviteId);
    const { action, user_id } = req.body;
    // Ensure all fields exits
    if (isNaN(inviteId) || !action || !user_id) {
      return res.status(400).json({ message: 'Missing or invalid parameters' });
    }
  
    try {
      if (action === 'accepted') {
        // Update the trip to accepted if they did accept
        await db.query('UPDATE trip_invites SET status = ? WHERE id = ?', ['accepted', inviteId]);
        // This yells at me but it has never actually given me an error in practice, I'm not sure what the error is TBH
        // Get the invite so we can update it to be in everyone's account specifically 
        const [[invite]] = await db.query(
          'SELECT trip_id FROM trip_invites WHERE id = ?',
          [inviteId]
        );
        // Make sure the invite exists 
        if (!invite?.trip_id) {
          return res.status(404).json({ message: 'Trip not found for invite' });
        }
  
        // Insert the person acccepting to the trip participants
        await db.query(
          'INSERT INTO trip_participants (trip_id, user_id, role) VALUES (?, ?, ?)',
          [invite.trip_id, user_id, 'member']
        );
  
        return res.status(200).json({ message: 'Invite accepted and participant added' });
      }
  
      if (action === 'declined') {
        await db.query('UPDATE trip_invites SET status = ? WHERE id = ?', ['declined', inviteId]);
        return res.status(200).json({ message: 'Invite declined' });
      }
  
      return res.status(400).json({ message: 'Invalid action' });
    } catch (err) {
      console.error('Error responding to invite:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
