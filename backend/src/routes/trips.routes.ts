import express, { Router, RequestHandler } from 'express';
import {
 getAllTrips,
 getTripById,
 createTrip,
//  addComment,
//  likeTrip,
 addParticipant,
 getTripParticipants,
 getTripsByCreator,
 getTripsByUser,
 deleteTrip
} from '../controllers/trips.controller';

const router: Router = express.Router();

// Get route to get all trips 
router.get('/', getAllTrips as RequestHandler);

// Get route to get trips created by a user (via ?creator_id=)
router.get('/creator', getTripsByCreator as RequestHandler);

// Get route trips where user is a participant
router.get('/user/:id', getTripsByUser as RequestHandler);

// Post route to create a trip
router.post('/', createTrip as RequestHandler);

// Get route to a get single trip by ID
router.get('/:id', getTripById as RequestHandler);

// // Add a comment to a trip
// router.post('/:id/comments', addComment as RequestHandler);

// // Like a trip
// router.post('/:id/like', likeTrip as RequestHandler);

// Add a participant to the trip
router.post('/:tripId/participants', addParticipant as RequestHandler);

// Get all participants for a trip
router.get('/:tripId/participants', getTripParticipants as RequestHandler);

// Delete a trip
router.delete('/:id', deleteTrip as RequestHandler);

export default router;