
import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const getSpotifyToken = async (_req: Request, res: Response) => {
  // Grab the spotify credentials from the env file
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  // Ensure they exist
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing Spotify credentials' });
  }
  // Spotify requests the authHeader to be a base 64 encoded string
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    // Request the access token from spotify
    const response = await axios.post(
      // We are authorizing the app, not any user, because we are not using an account to get anything from spotify yet
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          // Provide the neccesayr credentials and content type for spotify
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    res.json({ accessToken: response.data.access_token });
  } catch (err) {
    console.error('Spotify token fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch Spotify token' });
  }
};