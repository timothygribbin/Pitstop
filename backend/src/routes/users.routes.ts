import express, { RequestHandler } from 'express';
import { saveUser, searchUsers, getUserByFirebaseUid, getUserBySqlId } from '../controllers/users.controller';

const router = express.Router();
// Post route to save a user
router.post('/', saveUser as RequestHandler);
// Get route to search for a user
router.get('/search', searchUsers as RequestHandler);
// Get route to get a user from their firebase ID
router.get('/firebase/:uid', getUserByFirebaseUid as unknown as RequestHandler);
// get route to get a user by their SqlID
router.get('/sql/:id', getUserBySqlId as RequestHandler);

export default router;