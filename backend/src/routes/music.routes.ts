// backend/src/routes/songs.routes.ts
import express, { RequestHandler } from 'express';
import { proposeSong } from '../controllers/music.controller';

const router = express.Router();
// Post route to propose a song
router.post('/propose', proposeSong as RequestHandler);

export default router;