import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URL);
console.log('Connected');

const db = mongoose.connection.db;

// Just drop the index - model no longer needs it
try {
    await db.collection('tables').dropIndex('qrCodeToken_1');
    console.log('OK - Dropped qrCodeToken_1 index');
} catch (e) {
    console.log('Index not found (already dropped):', e.message);
}

console.log('Done! Restart the server now.');
await mongoose.disconnect();
