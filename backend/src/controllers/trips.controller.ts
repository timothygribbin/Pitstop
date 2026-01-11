import { Request, Response } from 'express';
import { db } from '../db/db';
import { FieldPacket } from 'mysql2';

interface Trip {
  id: number;
  creator_id: number;
  title: string;
  start_location: string;
  end_location: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
}

export const getAllTrips = async (_req: Request, res: Response) => {
  try {
    // This also yells at me but wouldn't work any other way, it works in practice because I know it will always be a Trip, i think SQL just has loose  return types
    // Simply gets all trips and sort them with the newest first
    const [rows]: [Trip[], FieldPacket[]] = await db.query(
      'SELECT * FROM trips ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(' Error fetching all trips:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const getTripById = async (req: Request, res: Response) => {
  // Extract the ID from request params
  const { id } = req.params;

  try {
    // Get the trip with the matching ID, also yells at me but same deal as before. In practice it works because I know it will always be a trip
    const [rows]: [Trip[], FieldPacket[]] = await db.query(
      'SELECT * FROM trips WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Trip not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(' Error fetching trip:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  // Extract the necessary fields from the request body
  const { name, start_location, end_location, start_date, end_date, creator_id } = req.body;
  // Ensure they all exist
  if (!name || !start_location || !end_location || !start_date || !end_date || !creator_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Insert the trip with all the necessary info into the trip
    const [result]: any = await db.query(
      `INSERT INTO trips (creator_id, title, start_location, end_location, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [creator_id, name, start_location, end_location, start_date, end_date]
    );
    // Grab the tripID from the result
    const tripId = result.insertId;

    // Insert creator as a participant
    await db.query(
      'INSERT INTO trip_participants (trip_id, user_id, role) VALUES (?, ?, ?)',
      [tripId, creator_id, 'creator']
    );

    res.status(201).json({ message: 'Trip created', tripId });
  } catch (err) {
    console.error(' Error creating trip:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const getTripParticipants = async (req: Request, res: Response) => {
  // Grab the tripID from the request parameters
  const tripId = parseInt(req.params.tripId);
  // Ensure it exists
  if (isNaN(tripId)) {
    return res.status(400).json({ message: 'Invalid trip ID' });
  }
  // Grab the users who are trip participants, the join connects each participant to the user so the information about each user is readily availbale
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.profile_pic, tp.role
       FROM users u
       JOIN trip_participants tp ON u.id = tp.user_id
       WHERE tp.trip_id = ?`,
      [tripId]
    );

    res.json(rows);
  } catch (err) {
    console.error(' Error fetching participants:', err);
    res.status(500).json({ message: 'Database error' });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  // Extract the necessary fields and set their role to member, that is the only role as of now other than the creator which is always already in the group because we tied that logic to the creation of the trip
  const tripId = parseInt(req.params.tripId);
  const { user_id, role = 'member' } = req.body;
  // Ensure each field exists
  if (!user_id || isNaN(tripId)) {
    return res.status(400).json({ message: 'Missing or invalid user_id/tripId' });
  }
  // Add the participant tot the trip 
  try {
    await db.query(
      'INSERT INTO trip_participants (trip_id, user_id, role) VALUES (?, ?, ?)',
      [tripId, user_id, role]
    );
    res.status(201).json({ message: 'Participant added to trip' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'User already added to trip' });
    }
    console.error(' Error adding participant:', err);
    res.status(500).json({ message: 'Database error' });
  }
};


// These could work but haven't built the UI yet, so I have it commented out
// //  Add comment to trip
// export const addComment = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { user_id, text } = req.body;

//   try {
//     await db.query(
//       'INSERT INTO comments (trip_id, user_id, text) VALUES (?, ?, ?)',
//       [id, user_id, text]
//     );
//     res.status(201).json({ message: 'Comment added' });
//   } catch (err) {
//     console.error(' Error adding comment:', err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// // Like trip
// export const likeTrip = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { user_id } = req.body;

//   try {
//     await db.query('INSERT IGNORE INTO likes (trip_id, user_id) VALUES (?, ?)', [id, user_id]);
//     res.status(200).json({ message: 'Trip liked' });
//   } catch (err) {
//     console.error(' Error liking trip:', err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };


export const getTripsByCreator = async (req: Request, res: Response) => {
  // Grab the creator ID from the URL
  const creator_id = req.query.creator_id as string;

  // Ensure the creator ID exists
  if (!creator_id) {
    return res.status(400).json({ message: 'Missing creator_id' });
  }

  try {
    // Get the trips for that creator ordered by newest first
    const [rows] = await db.query(
      'SELECT * FROM trips WHERE creator_id = ? ORDER BY created_at DESC',
      [creator_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(' Error fetching trips by creator:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getTripsByUser = async (req: Request, res: Response) => {
  // Grab all the userId from the request params
  const userId = parseInt(req.params.id);
  // Ensure it exists
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  try {
    //  Grab all trips where the user is a participant or a creator of the trip
    const [rows]: [Trip[], FieldPacket[]] = await db.query(
      `SELECT * FROM trips WHERE id IN (
        SELECT trip_id FROM trip_participants WHERE user_id = ?
      )`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(' Error fetching user trips:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const deleteTrip = async (req: Request, res: Response) => {
  // Grab the id from the request parameters
  const { id } = req.params;
  // Ensure the tripId exists
  if (!id) return res.status(400).json({ message: 'Missing trip ID' });
  try {
    // Delete all fields tied to this trip
    const deleteQueries = [
      'DELETE FROM trip_expenses WHERE trip_id = ?',
      'DELETE FROM votes WHERE proposal_id IN (SELECT id FROM proposed_songs WHERE trip_id = ?)',
      'DELETE FROM votes WHERE proposal_id IN (SELECT id FROM proposed_stops WHERE trip_id = ?)',
      'DELETE FROM confirmed_songs WHERE trip_id = ?',
      'DELETE FROM confirmed_stops WHERE trip_id = ?',
      'DELETE FROM proposed_songs WHERE trip_id = ?',
      'DELETE FROM proposed_stops WHERE trip_id = ?',
      'DELETE FROM trip_participants WHERE trip_id = ?',
      'DELETE FROM comments WHERE trip_id = ?',
      'DELETE FROM TRIP_INVITES WHERE TRIP_ID = ?',
      'DELETE FROM likes WHERE trip_id = ?',
      'DELETE FROM trips WHERE id = ?'
    ];
    // Loop through each query in the array
    for (const query of deleteQueries) {
      await db.query(query, [id]);
    }
    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (err) {
    console.error(' Error deleting trip:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};