import cron from 'node-cron';
import { db } from '../db/db';

export const startProposalExpiryJob = () => {
 cron.schedule('*/10 * * * *', async () => {
  try {
   // Expire old songs
   await db.query(`
    UPDATE proposed_songs
    SET expires_at = NOW()
    WHERE expires_at IS NULL
     AND created_at <= NOW() - INTERVAL 3 DAY
   `);

   // Expire old stops
   await db.query(`
    UPDATE proposed_stops
    SET expires_at = NOW()
    WHERE expires_at IS NULL
     AND created_at <= NOW() - INTERVAL 3 DAY
   `);

   console.log(' Expired old proposals (older than 3 days)');
  } catch (err) {
   console.error(' Error expiring proposals:', err);
  }
 });
};