import { Request, Response } from 'express';
import axios from 'axios';

export const getEncodedRoute = async (req: Request, res: Response) => {
  // Extract the start and end locations from the request body
  const { start, end } = req.body;

  try {
    // Load the key from the env
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    // make sure the apiKey exists
    if (!apiKey) {
      throw new Error('Google Maps API key not found in environment variables.');
    }
    // Build the url for the endpoint to call the API
    const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`;
    // Call the PAPI to compute the driving route, we get this back in the form of an encoded polyline
    const result = await axios.post(
      url,
      {
        // starting point
        origin: { address: start },
        // ending point
        destination: { address: end },
        // driving specified
        travelMode: 'DRIVE',
        // type of poly line
        polylineEncoding: 'ENCODED_POLYLINE',
      },
      {
        headers: {
          // Content type is require for Google Routes API
          'Content-Type': 'application/json',
          // Only returns the neccesary fields to reduce loading times
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
      }
    );
    // Extract the route from the result, it could return more than one driving option but we only want the optimal one.
    const route = result.data.routes[0];

    // Ensure the route and polylline exist
    if (!route || !route.polyline?.encodedPolyline) {
      throw new Error('Route or encoded polyline not found in response.');
    }

    res.status(200).json({
      encodedPolyline: route.polyline.encodedPolyline,
      duration: route.duration,
      distance: route.distanceMeters,
    });
    // Catch any error 👍🏻
  } catch (error: any) {
    console.error('Google Route API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Route fetch failed', details: error.response?.data || error.message });
  }
};
