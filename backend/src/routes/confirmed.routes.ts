import express from 'express';
import { getConfirmedSongs, getConfirmedStops } from '../controllers/confirmed.controller';

const router = express.Router();
// Variables are well named so these are pretty self explanatory across the board on the routes folder
// Get route to get confirmed songs
router.get('/songs/trip/:tripId', getConfirmedSongs);
// Get route to get confirmed stops
router.get('/stops/trip/:tripId', getConfirmedStops);

export default router;