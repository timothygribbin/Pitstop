import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
// Import all the routes created in the routes folder 
import { db } from './db/db';
import userRoutes from './routes/users.routes';
import friendRoutes from './routes/friends.routes';
import tripRoutes from './routes/trips.routes';
import tripInviteRoutes from './routes/tripinvites.routes';
import routeLogicRoutes from './routes/routes.routes';
import stopsRoutes from './routes/stops.routes';
import spotifyRoutes from './routes/spotify.routes';
import musicRoutes from './routes/music.routes';
import stopRoutes from './routes/stops.routes';
import voteRoutes from './routes/votes.routes';
import tripProposalRoutes from './routes/tripProposal.routes';
import { startProposalExpiryJob } from './cron/expireProposals';
import confirmedRoutes from './routes/confirmed.routes';
import expensesRoutes from './routes/expenses.routes';

// Call the cron job
startProposalExpiryJob();
// Configure the .env file
dotenv.config();
// Create the server
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Mounting each route, pretty self explanatory
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/trip-invites', tripInviteRoutes);
app.use(routeLogicRoutes);
app.use(stopsRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/trip-proposals', tripProposalRoutes);
app.use('/api/confirmed', confirmedRoutes);
app.use('/api/expenses', expensesRoutes);
app.get('/', (req, res) => {
  res.send('Pitstop backend is live!');
});

// Test MySQL connection on startup
const testDBConnection = async () => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('  MySQL connection successful. Test result:', (rows as any)[0].result);
  } catch (err) {
    console.error(' Failed to connect to MySQL:', err);
  }
};
// Connect the DB on the local host
app.listen(PORT, async () => {
  await testDBConnection();
  console.log(`Server running at http://localhost:${PORT}`);
});