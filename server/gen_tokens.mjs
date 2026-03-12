import 'dotenv/config';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const TABLE_SECRET = process.env.SECRET_KEY_TABLE_TOKEN || process.env.SECRET_KEY_ACCESS_TOKEN;
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('Khong tim thay MONGODB_URI trong .env');
    process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log('Da ket noi MongoDB\n');

const Table = mongoose.model('Table', new mongoose.Schema({
    tableNumber: String,
}, { strict: false }));

const tables = await Table.find({}).select('tableNumber').limit(10).lean();

if (tables.length === 0) {
    console.log('Khong co ban nao. Hay tao ban trong Admin truoc.');
} else {
    console.log('=== URL TEST CHO TUNG BAN ===\n');
    for (const t of tables) {
        const token = jwt.sign(
            { tableId: t._id, tableNumber: t.tableNumber, type: 'table_login', uniqueId: Math.random().toString(36).slice(2) },
            TABLE_SECRET,
            { expiresIn: '24h' }
        );
        console.log(`Ban: ${t.tableNumber}`);
        console.log(`http://localhost:5173/table-login?token=${token}`);
        console.log('');
    }
}

await mongoose.disconnect();
