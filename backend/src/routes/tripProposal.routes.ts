import { Router } from 'express';
import {
 getProposedSongs,
 getProposedStops,
 proposeSong,
 proposeStop,
 // expireOldProposals
} from '../controllers/tripProposals.controller';

const router = Router();

// Get route proposed songs for a trip
router.get('/:tripId/proposed-songs', getProposedSongs);

// Get route proposed stops for a trip
router.get('/:tripId/proposed-stops', getProposedStops);

// Post route propose a song
router.post('/propose-song', proposeSong);

// Post route propose a stop
router.post('/propose-stop', proposeStop);

export default router;