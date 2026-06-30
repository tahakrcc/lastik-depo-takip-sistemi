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

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, required: true },
    permissions: { type: String, required: true } // Storing as JSON string to keep compatibility with existing code
}, schemaOptions);

module.exports = mongoose.model('User', userSchema);
