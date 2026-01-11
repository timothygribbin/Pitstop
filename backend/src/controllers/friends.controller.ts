// controllers/friends.controller.ts
import { Request, Response } from 'express';
import { db } from '../db/db';

export const sendFriendRequest = async (req: Request, res: Response) => {
  // Extract the sender and receiver ID's from the request body
  const { sender_id, receiver_id } = req.body;
  // Ensure they exist
  if (!sender_id || !receiver_id) {
    return res.status(400).json({ message: 'Missing sender_id or receiver_id' });
  }

  try {
    // Check if friendship already exists in either direction
    const [existing]: any = await db.query(
      `SELECT * FROM friendships 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)`,
      [sender_id, receiver_id, receiver_id, sender_id]
    );
    // Make sure there is not an existing friendship by checking the above query
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Friend request already exists or already friends' });
    }

    // Insert new friend request
    await db.query(
      'INSERT INTO friendships (sender_id, receiver_id, status) VALUES (?, ?, ?)',
      [sender_id, receiver_id, 'pending']
    );

    res.status(201).json({ message: 'Friend request sent' });
  // Catch the error
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};  

export const acceptFriendRequest = async (req: Request, res: Response) => {
  // Parse the receiverID and sender ID from the 
  const receiver_id = parseInt(req.body.user_id);
  const sender_id = parseInt(req.params.id);
  // Ensure the neccesary fields are existing and not Nan, ran into error where it was crashing with NaN so added this check just to be sure
  if (!receiver_id || !sender_id || isNaN(receiver_id) || isNaN(sender_id)) {
    return res.status(400).json({ message: 'Invalid user IDs' });
  }
  // Update the friendship to be accepted
  try {
    await db.query(
      'UPDATE friendships SET status = ? WHERE sender_id = ? AND receiver_id = ?',
      ['accepted', sender_id, receiver_id]
    );

    res.status(200).json({ message: 'Friend request accepted' });
    // Catch the error if there is one
  } catch (err) {
    console.error('Error accepting request:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getFriends = async (req: Request, res: Response) => {
  // get the user id from the URL 
  const user_id = req.query.user_id as string;
  // We are retrieving a users friends, but friendships are bidirectional, so  we join on both sides and filter for an accepted status
  // and keeps themselves out of the results, only taking the person they are friends with. Probably an easier way to do this but it works for now
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.profile_pic FROM users u
       JOIN friendships f ON (u.id = f.sender_id OR u.id = f.receiver_id)
       WHERE f.status = 'accepted'
         AND (f.sender_id = ? OR f.receiver_id = ?)
         AND u.id != ?`,
      [user_id, user_id, user_id]
    );

    res.json(rows); 
    // Catch an error if there is one
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getPendingRequests = async (req: Request, res: Response) => {
  // Extract the firebase id from the URL
  const firebase_uid = req.query.user_id as string;
  // Ensure it exists
  if (!firebase_uid) return res.status(400).json({ message: 'Missing user_id' });

  try {
    // TBH really messy and not proud of this code, simply wanted to get it working but this is the top of the to do list
    // Convert Firebase UID to internal SQL ID
    const [userRows]: any = await db.query('SELECT id FROM users WHERE firebase_uid = ?', [firebase_uid]);
    // ensure the user exists
    if (!userRows.length) return res.status(404).json({ message: 'User not found' });
    // Get the id from the first row
    const userId = userRows[0].id;
    // Get the pending requests and join the ID's for requests that they both sent out and received 
    const [rows]: any = await db.query(
      `SELECT u.id, u.name, u.email, u.profile_pic FROM users u
       JOIN friendships f ON u.id = f.sender_id
       WHERE f.receiver_id = ? AND f.status = 'pending'`,
      [userId]
    );

    res.json(rows);
    // I don't know why i keep writing catch any error on all of these, maybe I'll work on some more specific error handling soon
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Remove a friendship
export const removeFriend = async (req: Request, res: Response) => {
  // Extract the neccesary fields
  const user_id = req.body.user_id;
  const other_person_id = parseInt(req.params.id);
  // Delete the friendship between the two
  try {
    await db.query(
      `DELETE FROM friendships
       WHERE (sender_id = ? AND receiver_id = ?)
          OR (sender_id = ? AND receiver_id = ?)`,
      [user_id, other_person_id, other_person_id, user_id]
    );
    res.status(200).json({ message: 'Friendship removed' });
  } catch (err: unknown) {
    console.error('Error removing friend:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

