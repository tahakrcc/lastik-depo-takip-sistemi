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

const movementSchema = new mongoose.Schema({
    type: { type: String },
    sku: { type: String },
    brand: { type: String },
    model: { type: String },
    warehouse: { type: String },
    qty: { type: Number },
    date: { type: String }
}, schemaOptions);

module.exports = mongoose.model('Movement', movementSchema);
