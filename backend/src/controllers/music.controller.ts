// backend/src/controllers/songs.controller.ts
import { Request, Response } from 'express';
import { db } from '../db/db';

export const proposeSong = async (req: Request, res: Response) => {
  // Extract all of the info from the request body beacuse we will need all of it to insert it into the thing
  const {
    trip_id,
    proposer_id,
    spotify_track_id,
    title,
    artist,
    album_cover_url,
    release_year,
  } = req.body;
  // Ensure all neccesary fields exist, don't really need the album_cover_url or release_year, so we let it slide if those are missing
  if (!trip_id || !proposer_id || !spotify_track_id || !title || !artist) {
    return res.status(400).json({ error: 'Missing required song fields' });
  }
  // Insert the proposed song into the proposed song table
  try {
    const [result] = await db.query(
      `INSERT INTO proposed_songs (trip_id, proposer_id, spotify_track_id, title, artist, album_cover_url, release_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [trip_id, proposer_id, spotify_track_id, title, artist, album_cover_url, release_year]
    );

    res.status(201).json({ message: 'Song proposed', id: (result as any).insertId });
  } catch (err) {
    console.error(' Error proposing song:', err);
    res.status(500).json({ error: 'Failed to propose song' });
  }
};