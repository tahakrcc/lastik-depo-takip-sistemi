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

const stockSchema = new mongoose.Schema({
    sku: { type: String },
    brand: { type: String },
    model: { type: String },
    size: { type: String },
    season: { type: String },
    dot: { type: String },
    minQty: { type: Number },
    warehouse: { type: String },
    location: { type: String },
    qty: { type: Number }
}, schemaOptions);

module.exports = mongoose.model('Stock', stockSchema);
