const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'otpExpiry'");
    console.log('Column Info:', res.rows);
    
    const users = await pool.query('SELECT email, "otpExpiry", otp FROM "User" WHERE otp IS NOT NULL LIMIT 1');
    console.log('Sample User Data:', users.rows);
    if (users.rows.length > 0) {
        console.log('Type of otpExpiry:', typeof users.rows[0].otpExpiry);
        console.log('Value of otpExpiry:', users.rows[0].otpExpiry);
    } else {
        console.log('No user with active OTP found to check values.');
    }
  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await pool.end();
  }
}

check();
