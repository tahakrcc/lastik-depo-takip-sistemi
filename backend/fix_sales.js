const mongoose = require('mongoose');
const Movement = require('./src/models/Movement');
const Sale = require('./src/models/Sale');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || "mongodb://gunesgozlemcisi_db_user:adana123@ac-c0umnms-shard-00-00.azseniu.mongodb.net:27017,ac-c0umnms-shard-00-01.azseniu.mongodb.net:27017,ac-c0umnms-shard-00-02.azseniu.mongodb.net:27017/inonu_site?ssl=true&replicaSet=atlas-km05m6-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function updateDB() {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const sales = await Sale.find({});
    console.log(`Found ${sales.length} sales`);

    let updated = 0;
    for (const sale of sales) {
        // Find matching OUT movement
        const move = await Movement.findOne({
            type: 'OUT',
            sku: sale.sku,
            qty: sale.qty,
            date: sale.date
        });

        if (move) {
            move.type = 'SALE';
            await move.save();
            updated++;
        }
    }
    console.log(`Updated ${updated} movements to SALE type.`);
    
    // As a fallback, if there are OUTs that match exactly today's date that were sales.
    // Actually the above exact match should be enough.
    
    process.exit(0);
}

updateDB();
