import express, { RequestHandler } from 'express';
import {
 sendFriendRequest,
 acceptFriendRequest,
 getFriends,
 getPendingRequests,
 removeFriend,
} from '../controllers/friends.controller';

const router = express.Router();
// Post route to send friend request
router.post('/:id', sendFriendRequest as RequestHandler); 
// Post route to accept friend request
router.post('/:id/accept', acceptFriendRequest as RequestHandler);
// Get route to get a user's friends
router.get('/', getFriends as RequestHandler);
// Get route to get their pending requests
router.get('/requests', getPendingRequests as RequestHandler);
// Delete route to remove a friend from their friend list
router.delete('/:id', removeFriend as RequestHandler);

export default router;