const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Metadata = require('../models/Metadata');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb+srv://gunesgozlemcisi_db_user:adana123@cluster0.azseniu.mongodb.net/inonu_site?retryWrites=true&w=majority&appName=Cluster0";
        if (!uri) {
            console.error('MONGODB_URI is not defined in .env file and no fallback provided');
            return;
        }

        await mongoose.connect(uri);
        console.log('Connected to MongoDB Atlas');

        await initDb();
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
};

async function initDb() {
    try {
        // Seed User
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const adminHash = bcrypt.hashSync('adana01', 10);
            await User.create({
                username: 'çapraz',
                password_hash: adminHash,
                role: 'admin',
                permissions: '["all"]'
            });
            console.log('Admin user seeded');
        }

        // Seed Metadata
        const metadataCount = await Metadata.countDocuments();
        if (metadataCount === 0) {
            const seedData = [
                { category: 'brands', value: 'Michelin' }, { category: 'brands', value: 'Continental' }, { category: 'brands', value: 'Pirelli' },
                { category: 'models', value: 'Pilot Sport 4' }, { category: 'models', value: 'Primacy 4' },
                { category: 'sizes', value: '195/65 R15' }, { category: 'sizes', value: '225/45 R17' },
                { category: 'seasons', value: 'Yaz' }, { category: 'seasons', value: 'Kış' }, { category: 'seasons', value: 'Dört Mevsim' },
                { category: 'warehouses', value: 'TK 1' }, { category: 'warehouses', value: 'TK 2' }
            ];
            await Metadata.insertMany(seedData);
            console.log('Metadata seeded');
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

connectDB();

module.exports = mongoose;