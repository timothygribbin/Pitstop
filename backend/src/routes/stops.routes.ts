import { RequestHandler, Router } from 'express';
import { searchStopsAlongRoute } from '../controllers/stops.controller';

const router = Router();
// Get the stops along the route using the Google Maps API
router.post('/search', searchStopsAlongRoute as RequestHandler);

export default router;