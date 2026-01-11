// backend/src/routes/spotify.routes.ts
import express, { RequestHandler } from 'express';
import { getSpotifyToken } from '../controllers/spotify.controller';

const router = express.Router();
// Get the access token from the Spotify API
router.get('/token', getSpotifyToken as RequestHandler);

export default router;