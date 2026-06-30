const Metadata = require('../models/Metadata');

exports.getAll = async () => {
    return await Metadata.find({});
};

exports.add = async (category, value) => {
    const meta = new Metadata({ category, value });
    const savedMeta = await meta.save();
    return savedMeta.id;
};

exports.remove = async (category, value) => {
    await Metadata.deleteOne({ category, value });
};