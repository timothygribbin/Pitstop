import express from 'express';
import { getEncodedRoute } from '../controllers/routes.controller';

const router = express.Router();
// Post route to get the encoded route from the Google Maps API
router.post('/api/routes/create', getEncodedRoute);

export default router;