import { Request, Response } from 'express';
import axios from 'axios';

export const searchStopsAlongRoute = async (req: Request, res: Response) => {
  // Extract the encoded polyline for the route we currently have, url and category for trom the request body
  // Later I'd like to updatre this polyline everytime we add a stop
  const { encodedPolyline, query, category } = req.body;
  // Make sure they exist
  if (!encodedPolyline || (!query && !category)) {
    return res.status(400).json({ error: 'Missing encoded polyline or search terms.' });
  }

  try {
    // Grab the api key from the env file and build the url 
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`;
    // Call the API to get the stops that match either the place or category
    const response = await axios.post(
      url,
      {
        // Take whichever exists, either the query or category of stop
        textQuery: query || category,
        // Search along this polyline for the closest spots
        searchAlongRouteParameters: {
          polyline: { encodedPolyline },
        },
      },
      {
        // Require content type in the header, filter out uneccessary fields
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
        },
      }
    );

    const places = response.data.places || [];
    res.status(200).json({ places });
  } catch (error: any) {
    console.error('Places API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch places',
      details: error.response?.data || error.message,
    });
  }
};