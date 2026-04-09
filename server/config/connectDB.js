import mongoose from "mongoose";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.MONGODB_URL) {
    throw new Error(
        "Vui lòng cung cấp MONGODB_URL trong tệp .env"
    )
}

async function connectDB() {
    try {
        const mongooseOptions = {};

        // Thêm CA certificate cho DocumentDB/TLS
        const caCertPath = path.join(__dirname, '../cacert.pem');
        if (fs.existsSync(caCertPath)) {
            mongooseOptions.ca = [fs.readFileSync(caCertPath)];
        } else if (process.env.NODE_ENV !== 'production') {
            // Dev only: cho phép invalid cert nếu không có CA file
            mongooseOptions.tls = true;
            mongooseOptions.tlsAllowInvalidCertificates = true;
        }

        await mongoose.connect(process.env.MONGODB_URL, mongooseOptions)
    } catch (error) {
        console.log("MongoDB connect error", error)
        process.exit(1);
    }
}

export default connectDB