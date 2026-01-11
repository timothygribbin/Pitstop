import { Request, Response } from 'express';
import { db } from '../db/db';

// GET all proposed songs for a trip 
export const getProposedSongs = async (req: Request, res: Response): Promise<void> => {
// Get the trip ID from the request params
  const { tripId } = req.params;

  try {
    // Get the proposed songs and don't grab the expired songs
    const [rows] = await db.query(
      `SELECT * FROM proposed_songs 
       WHERE trip_id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
      [tripId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching proposed songs:', err);
    res.status(500).json({ error: 'Failed to load proposed songs' });
  }
};

// GET all proposed stops for a trip 
export const getProposedStops = async (req: Request, res: Response): Promise<void> => {
  // Get the trip ID from the request parameters 
  const { tripId } = req.params;

  try {
    // Get all the proposed stops for the specific trips that are not expired
    const [rows] = await db.query(
      `SELECT * FROM proposed_stops 
       WHERE trip_id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
      [tripId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching proposed stops:', err);
    res.status(500).json({ error: 'Failed to load proposed stops' });
  }
};

// POST a new proposed song
export const proposeSong = async (req: Request, res: Response): Promise<void> => {
  // Extract the necessary fields from the request body
  const { trip_id, user_id, title, artist, album_cover, release_year, spotify_id } = req.body;
  // Ensure the necessary fields exist
  if (!trip_id || !user_id || !title || !artist || !spotify_id) {
    res.status(400).json({ error: 'Missing required song data.' });
    return;
  }

  try {
    // Insert the songs, automatically expire in 3 days
    await db.query(
      `INSERT INTO proposed_songs 
       (trip_id, user_id, title, artist, album_cover, release_year, spotify_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 DAY))`,
      [
        trip_id,
        user_id,
        title,
        artist,
        album_cover || null,
        release_year || null,
        spotify_id || null
      ]
    );
    res.status(201).json({ message: 'Song proposed successfully' });
  } catch (err) {
    console.error('Error proposing song:', err);
    res.status(500).json({ error: 'Failed to propose song' });
  }
};

// POST a new proposed stop
export const proposeStop = async (req: Request, res: Response): Promise<void> => {
  // Extract the fields in the request body
  const { trip_id, user_id, name, address, detour_time } = req.body;
  // Ensure the necessary fields exists, detour_time has had some issues calculating at times, so I let it slide because it defaults to 0 and doesn't happen often, may change 
  if (!trip_id || !user_id || !name || !address) {
    res.status(400).json({ error: 'Missing required stop data.' });
    return;
  }

  try {
    // Add the proposed stop to the table and automatically expire them in 3 days
    await db.query(
      `INSERT INTO proposed_stops 
       (trip_id, user_id, name, address, detour_time, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 DAY))`,
      [
        trip_id,
        user_id,
        name,
        address,
        detour_time || 0
      ]
    );
    res.status(201).json({ message: 'Stop proposed successfully' });
  } catch (err) {
    console.error('Error proposing stop:', err);
    res.status(500).json({ error: 'Failed to propose stop' });
  }
};