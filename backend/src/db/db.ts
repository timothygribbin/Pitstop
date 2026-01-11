import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
// Configure and run the DB, really just boiler plate code here
dotenv.config({ path: '.env.local' });

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});