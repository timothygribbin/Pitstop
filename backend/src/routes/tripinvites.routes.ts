// routes/tripInvites.routes.ts
import express, { RequestHandler, Router } from 'express';
import {
 sendTripInvite,
 getPendingTripInvites,
 respondToTripInvite
} from '../controllers/tripinvites.controller';

const router: Router = express.Router();

// Post route Send a trip invite
router.post('/', sendTripInvite as RequestHandler);
// Get route to get the pending trip invites for a user
router.get('/pending/:userId', getPendingTripInvites as RequestHandler);
// Post route to respond to a trip invite
router.post('/:inviteId/respond', respondToTripInvite as RequestHandler);

export default router;