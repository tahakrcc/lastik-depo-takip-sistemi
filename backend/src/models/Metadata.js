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

const metadataSchema = new mongoose.Schema({
    category: { type: String, required: true },
    value: { type: String, required: true }
}, schemaOptions);

module.exports = mongoose.model('Metadata', metadataSchema);
