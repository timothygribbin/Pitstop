import { Request, Response } from 'express';
import { db } from '../db/db';

export const getConfirmedSongs = async (req: Request, res: Response) => {
  // Extract the trip id from the paramters of the request
  const { tripId } = req.params;
  try {
    // Get the list of information for the songs that have been approved for this trip
    const [rows] = await db.query(
      `SELECT id, spotify_track_id, title, artist, album_cover_url, release_year, added_by, added_at
       FROM confirmed_songs
       WHERE trip_id = ?`,
      [tripId]
    );
    res.status(200).json(rows);
    // Catch the error if there is an issue getting the list
  } catch (err) {
    console.error('Error fetching confirmed songs:', err);
    res.status(500).json({ error: 'Failed to load confirmed songs' });
  }
};

export const getConfirmedStops = async (req: Request, res: Response) => {
  // Extract tripId from the request params
  const { tripId } = req.params; 
  // Get the stops that have been confirmed for this trip
  try {
    const [rows] = await db.query(
      `SELECT id, name, address, detour_time, added_by, added_at
       FROM confirmed_stops
       WHERE trip_id = ?`,
      [tripId]
    );

    res.status(200).json(rows);
    // Catch the error if there is one loading the trip
  } catch (err) {
    console.error('Error fetching confirmed stops:', err);
    res.status(500).json({ error: 'Failed to load confirmed stops' });
  }
};