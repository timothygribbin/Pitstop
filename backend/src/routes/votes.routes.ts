import { RequestHandler, Router } from 'express';
import { 
 submitVote, 
 getVoteCounts, 
 getUserVotes 
} from '../controllers/votes.controller';

const router = Router();

// Submit or update a vote
router.post('/', submitVote as RequestHandler);

// Get total vote counts for all proposals in a trip
router.get('/counts/:tripId', getVoteCounts);

// Get current user's vote history for a trip
router.get('/trip/:tripId/user/:userId', getUserVotes);

export default router;