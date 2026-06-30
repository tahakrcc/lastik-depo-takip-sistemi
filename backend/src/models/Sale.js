const mongoose = require('mongoose');

const schemaOptions = {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
};

const saleSchema = new mongoose.Schema({
    customerName: { type: String },
    customerPhone: { type: String },
    sku: { type: String },
    brand: { type: String },
    model: { type: String },
    qty: { type: Number },
    price: { type: Number },
    date: { type: String }
}, schemaOptions);

module.exports = mongoose.model('Sale', saleSchema);
