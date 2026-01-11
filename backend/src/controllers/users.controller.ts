// controllers/users.controller.ts
import { Request, Response } from 'express';
import { db } from '../db/db';

export const saveUser = async (req: Request, res: Response) => {
  // Extract the userID, email and displayName from the request body
  const { uid, email, displayName } = req.body;
  // Ensure the neccesary fields exist, no display name needed right now
  if (!uid || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // Insert the the user into the DB, add their firebase uid, email, name and profile pic (always as null) 
  try {
    await db.query(
      'INSERT INTO users (firebase_uid, email, name, profile_pic) VALUES (?, ?, ?, NULL) ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name)',
      [uid, email, displayName]
    );
    res.status(201).json({ message: 'User saved successfully' });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ message: 'Database error' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  // Search for users from current user ID
  const { q, currentUserId } = req.query;
  // Ensure they exist and the query is the correct type
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ message: 'Search query is required' });
  }
  // Build the query and run it
  try {
    // Search for similar names similary to the users typed search
    let query = `
      SELECT id, name, email, profile_pic FROM users
      WHERE (name LIKE ? OR email LIKE ?)
    `;
    let params = [`%${q}%`, `%${q}%`];
    // Build the full query using everything above, this is pretty sloppy tbh and needs to be cleaned up but it works as of now
    if (currentUserId) {
      query += `
        AND id != ?
        AND id NOT IN (
          SELECT CASE
            WHEN sender_id = ? THEN receiver_id
            WHEN receiver_id = ? THEN sender_id
          END
          FROM friendships
          WHERE sender_id = ? OR receiver_id = ?
        )
      `;
      params = [...params, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId];
    }

    query += ' LIMIT 10';

    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Database error' });
  }
};


// New function to get SQL ID from Firebase UID
export const getUserByFirebaseUid = async (req: Request, res: Response) => {
  // Get the firebase uid from the requestr parameters
  const { uid } = req.params;
  // Ensure the uid exists
  if (!uid) return res.status(400).json({ message: 'Missing UID' });

  try {
    // Get the USer from the SQL DB where the firebase_uid is equivalent to the current one
    const [rows]: any = await db.query('SELECT id FROM users WHERE firebase_uid = ?', [uid]);
    // Make sure the user exists
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Now return the ID
    return res.status(200).json({ id: rows[0].id });
  } catch (err) {
    console.error('Error fetching SQL ID from Firebase UID:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserBySqlId = async (req: Request, res: Response) => {
  // Extract the sqlId from the request parameters
  const sqlId = parseInt(req.params.id);
  // Ensure it exists
  if (isNaN(sqlId)) return res.status(400).json({ message: 'Invalid user ID' });

  try {
    // Get the user with that SQL ID
    const [rows]: any = await db.query('SELECT id, name, email, profile_pic FROM users WHERE id = ?', [sqlId]);
    // Make sure we get a user to return
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    // Return the user
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
